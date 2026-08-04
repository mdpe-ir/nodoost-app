import type { PurchaseResult, QueuedSubscription, Tier } from '@/domain/entities';
import { faNum } from '@/core/utils/faNum';

/**
 * متنِ همه‌ی حالت‌های «صفِ اشتراک» یک‌جا.
 *
 * چرا جدا: این جمله‌ها روی پول‌اند. کاربری که وسطِ نقره‌ای الماس می‌خرد باید
 * *قبل از پرداخت* بداند روزهای باقی‌مانده‌اش نمی‌سوزد، و *بعد از پرداخت* همان
 * قول را دوباره ببیند. اگر متن در دو فایل تکرار شود، یکی‌شان قدیمی می‌ماند.
 *
 * منبعِ حقیقتِ «چه اتفاقی افتاد» سرور است (PurchaseResult.outcome) — این‌جا فقط
 * روایت می‌شود، دوباره حساب نمی‌شود.
 */

export const tierNameOf = (tiers: Tier[], level?: number): string =>
  (level != null && tiers.find((t) => t.level === level)?.name) || 'اشتراک';

const daysPhrase = (days: number) => `${faNum(days)} روز`;

/** «۱۲ روز نقره‌ای» برای یک قطعه‌ی صف. */
export const queuedPhrase = (tiers: Tier[], q: QueuedSubscription): string =>
  `${daysPhrase(q.daysRemaining)} ${tierNameOf(tiers, q.tierLevel)}`;

/** «پس از آن: ۱۲ روز نقره‌ای» — یک خط زیرِ اشتراکِ فعال. */
export const queueSummary = (tiers: Tier[], queue: QueuedSubscription[]): string | null => {
  if (!queue.length) return null;
  return `پس از آن: ${queue.map((q) => queuedPhrase(tiers, q)).join(' ، ')}`;
};

/**
 * تأییدِ پیش از پرداختِ ارتقا. عمداً پیش از باز شدنِ درگاه نشان داده می‌شود:
 * بعد از پرداخت دیگر «انصراف» معنایی ندارد.
 *
 * اگر روزی برای حفظ نمانده باشد (کاربرِ رایگان) اصلاً لازم نیست بپرسیم.
 */
export const upgradeConfirm = (
  tiers: Tier[],
  target: Tier,
  activeLevel: number,
  activeDaysLeft: number
): { title: string; message: string } | null => {
  if (activeLevel <= 1 || target.level <= activeLevel || activeDaysLeft <= 0) return null;
  return {
    title: `ارتقا به ${target.name}`,
    message:
      `اشتراکِ ${target.name} از همین حالا فعال می‌شود.\n` +
      `${daysPhrase(activeDaysLeft)} باقی‌مانده‌ی اشتراکِ ${tierNameOf(tiers, activeLevel)} شما ` +
      `از بین نمی‌رود و پس از پایانِ ${target.name} ادامه پیدا می‌کند.`,
  };
};

/** پیامِ پس از خرید، از روی چیزی که سرور واقعاً انجام داد. */
export const purchaseResultMessage = (
  tiers: Tier[],
  res: PurchaseResult
): { title: string; message: string } => {
  const name = tierNameOf(tiers, res.tier);
  const tail = queueSummary(tiers, res.deferred);

  if (res.already) {
    return {
      title: 'این خرید از قبل ثبت شده بود',
      message: `اشتراکِ ${name} شما فعال است.${tail ? `\n${tail}` : ''}`,
    };
  }

  switch (res.outcome) {
    case 'upgraded':
      return {
        title: `${name} فعال شد`,
        message:
          `اشتراکِ ${name} از همین حالا فعال است.` +
          (tail ? `\nروزهای اشتراکِ قبلی شما حفظ شد — ${tail}` : ''),
      };
    case 'renewed':
      return {
        title: 'اشتراکِ شما تمدید شد',
        message: `اعتبارِ اشتراکِ ${name} شما اضافه شد.`,
      };
    case 'queued':
      // خریدِ سطحِ پایین‌تر. از اپ نباید ممکن می‌شد (کارتش قفل است)، ولی رسیدِ
      // بازار می‌تواند از مسیرِ دیگری برسد — و ما هرگز پولِ گرفته‌شده را رد نمی‌کنیم.
      return {
        title: 'خریدِ شما در صف قرار گرفت',
        message:
          `اشتراکِ ${name} شما همچنان فعال است و این خرید پس از پایانِ آن شروع می‌شود.` +
          (tail ? `\n${tail}` : ''),
      };
    default:
      return {
        title: `اشتراکِ ${name} فعال شد`,
        message: 'از همین حالا می‌توانید از امکاناتِ این سطح استفاده کنید.',
      };
  }
};
