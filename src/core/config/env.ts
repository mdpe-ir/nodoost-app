import Constants from 'expo-constants';

/**
 * پیکربندیِ محیط. آدرسِ API از app.json (extra) خوانده می‌شود تا کد به مقدارِ
 * ثابت وابسته نباشد و در dev/prod به‌سادگی قابلِ تغییر باشد.
 */
type Extra = { apiBaseUrl?: string; wsBaseUrl?: string };

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const normalize = (url: string) => url.replace(/\/+$/, '');

export const env = {
  apiBaseUrl: normalize(extra.apiBaseUrl ?? 'https://nodoost.ir'),
  get wsBaseUrl(): string {
    if (extra.wsBaseUrl) return normalize(extra.wsBaseUrl);
    return this.apiBaseUrl.replace(/^http/i, 'ws');
  },
} as const;
