import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { File as ExpoFile } from 'expo-file-system';
import * as Updates from 'expo-updates';
import { ApiError } from './ApiError';
import type { TokenStorage } from '@/core/storage/TokenStorage';

const clientMetadataHeaders = (): Record<string, string> => ({
  'X-Client-Platform': Platform.OS,
  'X-Client-App-Version':
    Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '',
  'X-Client-Build-Version': Application.nativeBuildVersion ?? '',
  'X-Client-Update-ID':
    Updates.updateId ?? (Updates.isEmbeddedLaunch ? 'embedded' : ''),
});

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...clientMetadataHeaders(),
    };
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
    if (!res.ok) {
      // بدنه‌ی خطا کاملاً خوانده می‌شود، نه فقط کدش: سرور کنارِ کد، زمینه هم
      // می‌دهد (`limit`، `required_tier`) و پنجره‌ی ارتقا از همان تغذیه می‌شود.
      //
      // ۴۰۲ تا پیش از این همیشه به `free_limit_reached` نگاشت می‌شد؛ یعنی سقفِ
      // شانسی و سقفِ لایک هم با متنِ «گفتگوی رایگانت تمام شد» نشان داده می‌شدند
      // (و شرطِ random_limit_reached در ویومدل هرگز درست نمی‌شد). حالا کدِ خودِ
      // سرور می‌ماند و فقط اگر بدنه‌ای نبود، به همان پیش‌فرضِ قدیمی می‌افتیم.
      let body: Record<string, unknown> | undefined;
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {}
      const code =
        typeof body?.error === 'string'
          ? (body.error as string)
          : res.status === 402
            ? 'free_limit_reached'
            : undefined;
      throw new ApiError(res.status, code, body);
    }
    if (res.status === 204) return null as T;
    return (await res.json().catch(() => null)) as T;
  }

  /**
   * آپلودِ فایلِ چندبخشی — روی وب Blob و روی نیتیو Fileِ واقعیِ expo-file-system.
   *
   * مثلِ request روی ۴۰۱ یک‌بار توکن را تازه می‌کند و دوباره می‌فرستد. نبودِ این
   * تلاشِ دوباره یعنی کاربری که توکنِ دسترسی‌اش تازه منقضی شده، در گامِ عکسِ
   * تکمیلِ پروفایل «ثبت ناموفق بود» می‌گرفت. FormData در فراخوانیِ بازگشتی از نو
   * ساخته می‌شود؛ بدنه‌ی مصرف‌شده قابلِ ارسالِ دوباره نیست.
   */
  async upload<T>(path: string, uri: string, field = 'photo', retried = false): Promise<T> {
    const token = await this.tokens.getAccess();
    const form = new FormData();
    const name = uri.split('/').pop() || 'photo.jpg';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append(field, blob, name);
    } else {
      // global fetch در Expo SDK 56 همان expo/fetch است و شیء قدیمیِ
      // React Native به‌شکلِ {uri,name,type} را نمی‌پذیرد. File رابطِ Blob/bytes
      // واقعی را فراهم می‌کند تا بدنه‌ی multipart پیش از ارسال درست سریال شود.
      form.append(field, new ExpoFile(uri), name);
    }
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: {
        ...clientMetadataHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    if (res.status === 401 && !retried) {
      if (await this.tryRefresh()) return this.upload<T>(path, uri, field, true);
      throw new ApiError(401);
    }
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = (await res.json())?.error;
      } catch {}
      throw new ApiError(res.status, code);
    }
    return (await res.json().catch(() => null)) as T;
  }

  /** multipart با فیلدهای دلخواه (پیامِ صوتی/عکس در گفتگو). */
  async uploadForm<T>(path: string, form: FormData, retried = false): Promise<T> {
    const token = await this.tokens.getAccess();
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: {
        ...clientMetadataHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    if (res.status === 401 && !retried) {
      if (await this.tryRefresh()) return this.uploadForm<T>(path, form, true);
      throw new ApiError(401);
    }
    if (!res.ok) {
      let body: Record<string, unknown> | undefined;
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {}
      const code = typeof body?.error === 'string' ? (body.error as string) : undefined;
      throw new ApiError(res.status, code, body);
    }
    return (await res.json().catch(() => null)) as T;
  }

  async authHeaders(): Promise<Record<string, string>> {
    const token = await this.tokens.getAccess();
    return {
      ...clientMetadataHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = await this.tokens.getRefresh();
    if (!refreshToken) return false;
    try {
      const res = await fetch(this.baseUrl + '/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...clientMetadataHeaders(),
        },
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
