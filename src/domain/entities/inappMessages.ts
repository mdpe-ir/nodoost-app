/**
 * پیام‌های درون‌برنامه‌ای — یک مدل، سه سطحِ مزاحمت:
 *
 *   banner → نوارِ سنجاق‌شده‌ی بالای صفحه‌ی کاوش
 *   popup  → پنجره‌ی بازشو روی کلِ اپ
 *   alarm  → کارت در صفحه‌ی اعلان‌ها؛ با زدنِ آن، صفحه‌ی تمام‌صفحه باز می‌شود
 *
 * محتوا و «واجدِ شرایط بودن» هر دو از سرور می‌آیند؛ کلاینت فقط سیاستِ تکرار را
 * (نشستی/روزانه/فاصله) اجرا می‌کند و رویدادها را برمی‌گرداند.
 */
export type InAppSurface = 'banner' | 'popup' | 'alarm';

export type InAppAccent = 'gold' | 'info' | 'success' | 'warn' | 'danger';

export type InAppPolicy =
  | 'once'
  | 'once_per_session'
  | 'once_per_day'
  | 'max_count'
  | 'always';

/**
 * `server` یعنی سرور شمارش را روی حسابِ کاربر نگه می‌دارد (با نصبِ دوباره هم
 * برنمی‌گردد). `client` یعنی فقط حافظه‌ی همین دستگاه ملاک است — کاربر با ورودِ
 * دوباره باز می‌بیندش.
 */
export type InAppScope = 'server' | 'client';

export type InAppEvent = 'impression' | 'dismiss' | 'click';

export interface InAppMessage {
  id: number;
  surface: InAppSurface;
  title: string;
  body: string;
  /** متنِ بلندِ صفحه‌ی تمام‌صفحه؛ خالی ⇒ همان body. */
  fullBody: string;
  imageUrl?: string;
  /** کلیدِ ستِ آیکنِ اپ؛ نامعتبر بودنش بی‌خطر است (آیکن نشان داده نمی‌شود). */
  icon?: string;
  accent: InAppAccent;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  dismissible: boolean;

  policy: InAppPolicy;
  maxImpressions: number;
  cooldownMinutes: number;
  scope: InAppScope;
  priority: number;

  /** چند بار سرور نمایشش را ثبت کرده (فقط اطلاع‌رسانی؛ فیلترِ اصلی سمتِ سرور است). */
  impressions: number;
  lastSeenAt?: string;
}
