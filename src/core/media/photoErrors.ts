import { ApiError } from '@/core/http/ApiError';
import { ImageProcessError } from './normalizeImage';

/**
 * تشخیصِ انسانیِ خطای عکس — به‌جای «ثبت ناموفق بود» برای همه‌چیز.
 *
 * پیش‌تر هر شکستی (قطعیِ اینترنت، انقضای نشست، سقفِ عکس، خطای سرور) یک پیام
 * می‌گرفت و کاربر نمی‌فهمید چه کند. کدهای زیر همان‌هایی‌اند که
 * internal/photos/handler.go برمی‌گرداند.
 */

const NETWORK =
  'اینترنت وصل نیست یا ارتباط وسطِ کار قطع شد. اتصالت را بررسی کن و دوباره بفرست.';
const GENERIC = 'ثبت ناموفق بود. دوباره تلاش کن.';

/** شکستِ خودِ fetch (نه پاسخِ سرور) روی نیتیو TypeError است، نه ApiError. */
function isNetworkFailure(e: unknown): boolean {
  if (e instanceof ApiError) return false;
  if (e instanceof TypeError) return true;
  return e instanceof Error && /network|failed to fetch|timeout|aborted/i.test(e.message);
}

export function photoErrorMessage(e: unknown): string {
  // خطای پردازشِ محلی پیامِ آماده‌ی خودش را دارد.
  if (e instanceof ImageProcessError) return e.message;
  if (isNetworkFailure(e)) return NETWORK;

  if (e instanceof ApiError) {
    if (e.status === 401) {
      return 'نشستِ تو منقضی شده. یک‌بار از حساب خارج شو و دوباره وارد شو.';
    }
    if (e.status === 402 || e.code === 'photo_limit_reached') {
      return 'به سقفِ تعدادِ عکسِ سطحِ فعلی‌ات رسیده‌ای. یکی از عکس‌ها را پاک کن یا سطحت را ارتقا بده.';
    }
    if (e.status === 413) {
      return 'حجمِ این عکس بیش از اندازه است. عکسِ سبک‌تری انتخاب کن.';
    }

    switch (e.code) {
      case 'not a valid image':
        return 'فرمتِ این عکس پشتیبانی نمی‌شود. عکسِ دیگری انتخاب کن یا با دوربین یکی بگیر.';
      case 'invalid upload':
      case 'photo field required':
      case 'read failed':
        return 'فایلِ عکس درست ارسال نشد. یک‌بارِ دیگر تلاش کن.';
      case 'encode failed':
        return 'سرور نتوانست این عکس را پردازش کند. عکسِ دیگری امتحان کن.';
      case 'store failed':
      case 'save failed':
        return 'ذخیره‌ی عکس روی سرور انجام نشد. چند لحظه بعد دوباره تلاش کن.';
      case 'update failed':
        return 'تغییرِ عکس انجام نشد. چند لحظه بعد دوباره تلاش کن.';
      case 'photo not approved':
        return 'این عکس هنوز تأیید نشده یا رد شده و نمی‌تواند عکسِ پروفایلت باشد. عکسِ دیگری انتخاب کن.';
      case 'server error':
        return 'سرور موقتاً پاسخ نمی‌دهد. کمی بعد دوباره تلاش کن.';
    }

    if (e.status >= 500) return 'سرور موقتاً پاسخ نمی‌دهد. کمی بعد دوباره تلاش کن.';
  }

  return GENERIC;
}
