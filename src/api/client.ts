import Constants from 'expo-constants';
import { getItem, setItem, deleteItem } from '@/lib/storage';

const DEFAULT_BASE =
  ((Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.apiBaseUrl as string) ??
  'http://localhost:8080';

let baseUrl = DEFAULT_BASE;
export function setApiBase(url: string) {
  baseUrl = url.replace(/\/$/, '');
}
export function getApiBase() {
  return baseUrl;
}

const ACCESS = 'nd_access';
const REFRESH = 'nd_refresh';

export function getAccess() {
  return getItem(ACCESS);
}
export async function setTokens(access: string, refresh?: string) {
  await setItem(ACCESS, access);
  if (refresh) await setItem(REFRESH, refresh);
}
export async function clearTokens() {
  await deleteItem(ACCESS);
  await deleteItem(REFRESH);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code?: string) {
    super(code || 'HTTP ' + status);
    this.status = status;
    this.code = code;
  }
}

interface Opts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  _retried?: boolean;
}

async function tryRefresh(): Promise<boolean> {
  const r = await getItem(REFRESH);
  if (!r) return false;
  try {
    const res = await fetch(baseUrl + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: r }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.access_token) {
      await setTokens(data.access_token, data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const method = opts.method || 'GET';
  const useAuth = opts.auth !== false;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useAuth) {
    const token = await getItem(ACCESS);
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && useAuth && !opts._retried) {
    const ok = await tryRefresh();
    if (ok) return api<T>(path, { ...opts, _retried: true });
    throw new ApiError(401);
  }
  if (res.status === 402) throw new ApiError(402, 'free_limit_reached');
  if (!res.ok) {
    let code: string | undefined;
    try {
      const j = await res.json();
      code = j?.error;
    } catch {}
    throw new ApiError(res.status, code);
  }
  if (res.status === 204) return null as T;
  return (await res.json().catch(() => null)) as T;
}

/** آپلودِ عکس (multipart) */
export async function uploadPhoto(uri: string): Promise<unknown> {
  const token = await getItem(ACCESS);
  const form = new FormData();
  const name = uri.split('/').pop() || 'photo.jpg';
  form.append('photo', { uri, name, type: 'image/jpeg' } as unknown as Blob);
  const res = await fetch(baseUrl + '/api/me/photos', {
    method: 'POST',
    headers: token ? { Authorization: 'Bearer ' + token } : undefined,
    body: form,
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json().catch(() => null);
}
