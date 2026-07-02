/**
 * پیکربندیِ محیط. آدرسِ API از متغیرِ محیطیِ EXPO_PUBLIC_API_BASE_URL خوانده می‌شود.
 * اکسپو فایل‌های .env* را خودکار بارگذاری و این مقدار را در زمانِ build درون‌ریزی می‌کند،
 * پس در dev از .env و در deploy از ENVِ داکر می‌آید — بدونِ وابستگی به مقدارِ ثابت.
 */
const normalize = (url: string) => url.replace(/\/+$/, '');

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const WS_BASE = process.env.EXPO_PUBLIC_WS_BASE_URL;

export const env = {
  apiBaseUrl: normalize(API_BASE),
  get wsBaseUrl(): string {
    if (WS_BASE) return normalize(WS_BASE);
    return this.apiBaseUrl.replace(/^http/i, 'ws');
  },
} as const;
