import { Platform } from 'react-native';
import { ApiError } from './ApiError';
import type { TokenStorage } from '@/core/storage/TokenStorage';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** اگر false باشد هدرِ Authorization فرستاده نمی‌شود. */
  auth?: boolean;
}

/**
 * کلاینتِ HTTP: ارسالِ توکن، تلاشِ یک‌باره برای refresh روی ۴۰۱، و نگاشتِ خطاها.
 * تنها نقطه‌ای است که با fetch صحبت می‌کند؛ بقیه‌ی برنامه از آن استفاده می‌کنند.
 */
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokens: TokenStorage
  ) {}

  async request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
    const method = opts.method ?? 'GET';
    const useAuth = opts.auth !== false;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (useAuth) {
      const token = await this.tokens.getAccess();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    // این API کاملاً پویاست (کاوش، نزدیک‌ها، چت …). بدونِ این هدرها، لایه‌ی
    // کشِ OkHttp روی اندروید، وب‌ویو یا CDN می‌تواند پاسخِ کهنه بدهد — نشانه‌اش
    // «کاوش با بازکردنِ اپ به‌روز نمی‌شود». پس هر GET همیشه از سرور تازه گرفته می‌شود.
    if (method === 'GET') {
      headers['Cache-Control'] = 'no-cache';
      headers['Pragma'] = 'no-cache';
    }

    const res = await fetch(this.baseUrl + path, {
      method,
      headers,
      // روی وب/وب‌ویو کشِ HTTP را دور می‌زند؛ روی نیتیو بی‌اثر ولی بی‌خطر است.
      cache: method === 'GET' ? 'no-store' : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 401 && useAuth && !retried) {
      if (await this.tryRefresh()) return this.request<T>(path, opts, true);
      throw new ApiError(401);
    }
    if (res.status === 402) throw new ApiError(402, 'free_limit_reached');
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = (await res.json())?.error;
      } catch {}
      throw new ApiError(res.status, code);
    }
    if (res.status === 204) return null as T;
    return (await res.json().catch(() => null)) as T;
  }

  /** آپلودِ فایلِ چندبخشی — روی وب Blob و روی نیتیو {uri,name,type}. */
  async upload<T>(path: string, uri: string, field = 'photo'): Promise<T> {
    const token = await this.tokens.getAccess();
    const form = new FormData();
    const name = uri.split('/').pop() || 'photo.jpg';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append(field, blob, name);
    } else {
      form.append(field, { uri, name, type: 'image/jpeg' } as unknown as Blob);
    }
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = (await res.json())?.error;
      } catch {}
      throw new ApiError(res.status, code);
    }
    return (await res.json().catch(() => null)) as T;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = await this.tokens.getRefresh();
    if (!refreshToken) return false;
    try {
      const res = await fetch(this.baseUrl + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      await this.tokens.save(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}
