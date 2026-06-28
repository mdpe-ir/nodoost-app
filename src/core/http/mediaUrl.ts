import { env } from '@/core/config/env';

/**
 * آدرسِ نسبیِ رسانه («/uploads/x.jpg» که بک‌اند می‌دهد) را به آدرسِ کاملِ بک‌اند
 * تبدیل می‌کند تا روی وب (originِ متفاوت) و نیتیو درست بارگذاری شود.
 */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return env.apiBaseUrl + (url.startsWith('/') ? url : `/${url}`);
}
