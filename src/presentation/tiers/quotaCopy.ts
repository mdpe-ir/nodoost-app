import type { IconName } from '@/presentation/components/Icon';
import type { Quota, QuotaItem, QuotaKey } from '@/domain/entities';
import { faNum } from '@/core/utils/faNum';

/**
 * متنِ همه‌ی حالت‌های سهمیه، یک‌جا.
 *
 * چرا جدا: این جمله‌ها همان چیزی‌اند که کاربر باید *قبل از* تمام‌شدنِ سهمیه
 * بفهمد. اگر در پنج صفحه تکرار شوند، یکی‌شان می‌ماند و همان یکی همان
 * سوءتفاهمی را می‌سازد که این بازطراحی برای رفعش انجام شد.
 *
 * قاعده‌ی نوشتن: هیچ‌وقت فقط «قفل است» نگو — بگو «چقدر مانده»، «کِی برمی‌گردد»
 * و «کدام سطح بازش می‌کند».
 */

export interface QuotaMeta {
  /** نامِ کوتاه برای چیپ و ردیفِ سهمیه. */
  label: string;
  icon: IconName;
  /** نامِ امکان — همان چیزی که در بنرِ صفحه‌ی سطح‌ها می‌نشیند. */
  feature: string;
  /** تیترِ پنجره‌ی «سقف پر شد». */
  exhaustedTitle: string;
}

export const QUOTA_META: Record<QuotaKey, QuotaMeta> = {
  conversation: {
    label: 'شروعِ گفتگو',
    icon: 'send-fill',
    feature: 'شروعِ گفتگوی تازه',
    exhaustedTitle: 'سهمِ شروعِ گفتگویت تمام شد',
  },
  random: {
    label: 'چتِ شانسی',
    icon: 'lightning-fill',
    feature: 'چتِ شانسی',
    exhaustedTitle: 'سهمِ چتِ شانسیِ امروزت تمام شد',
  },
  like: {
    label: 'پسندیدن',
    icon: 'heart-fill',
    feature: 'پسندیدنِ بیشتر',
    exhaustedTitle: 'سهمِ پسندِ امروزت تمام شد',
  },
};

/** نگاشتِ کدِ خطای ۴۰۲ سرور به سهمیه‌ای که پر شده. */
export const quotaKeyForError = (code?: string): QuotaKey | null => {
  switch (code) {
    case 'free_limit_reached':
    case 'daily_limit_reached':
      return 'conversation';
    case 'random_limit_reached':
      return 'random';
    case 'swipe_limit_reached':
      return 'like';
    default:
      return null;
  }
};

/** «۳ از ۳۰ مانده» یا «نامحدود». */
export const remainingText = (it: QuotaItem): string => {
  if (it.unlimited || it.remaining == null || it.limit == null) return 'نامحدود';
  return `${faNum(it.remaining)} از ${faNum(it.limit)} مانده`;
};

/** فقط عدد — برای چیپِ فشرده‌ی هدر. */
export const remainingShort = (it: QuotaItem): string =>
  it.unlimited || it.remaining == null ? '∞' : faNum(it.remaining);

/**
 * کِی سهمیه برمی‌گردد. برای سهمیه‌ی مادام‌العمرِ کاربرِ رایگان عمداً null است:
 * گفتنِ «فردا تازه می‌شود» دقیقاً همان دروغی است که باعث می‌شد کاربر منتظرِ
 * فردایی بماند که هرگز نمی‌آید.
 */
export const resetText = (it: QuotaItem, quota: Quota | null): string | null => {
  if (it.scope !== 'daily' || it.unlimited || !quota?.resetsAt) return null;
  const ms = new Date(quota.resetsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'به‌زودی تازه می‌شود';
  const hours = Math.ceil(ms / 3_600_000);
  if (hours <= 1) return 'کمتر از یک ساعت تا تازه‌شدن';
  return `${faNum(hours)} ساعت تا تازه‌شدنِ سهمیه`;
};

/** «سهمِ رایگانِ حسابت» در برابر «سهمِ امروزت» — تفاوتِ حیاتیِ scope. */
export const scopeText = (it: QuotaItem): string =>
  it.scope === 'lifetime' ? 'سهمِ رایگانِ حسابت' : 'سهمِ امروزت';

/** توضیحِ آنچه با ارتقا به سطحِ پیشنهادی برای همین سهمیه عوض می‌شود. */
export const unlockText = (it: QuotaItem, tierLabel: string): string | null => {
  if (!it.unlockTier) return null;
  if (it.unlockUnlimited) return `با ${tierLabel}: ${QUOTA_META[it.key].label} نامحدود`;
  if (it.unlockLimit != null) {
    return `با ${tierLabel}: ${faNum(it.unlockLimit)} ${QUOTA_META[it.key].label} در روز`;
  }
  return `با ${tierLabel} این سقف بالاتر می‌رود`;
};

/**
 * آستانه‌ی هشدارِ «دارد تمام می‌شود». عمداً محافظه‌کار است: هشدارِ زودهنگام و
 * پرتکرار به چشمِ تبلیغ می‌آید و بی‌اثر می‌شود.
 */
export const isLow = (it: QuotaItem): boolean =>
  !it.unlimited && it.remaining != null && it.remaining > 0 && it.remaining <= lowThreshold(it);

export const isExhausted = (it: QuotaItem): boolean =>
  !it.unlimited && it.remaining != null && it.remaining <= 0;

const lowThreshold = (it: QuotaItem): number => {
  if (it.limit == null) return 0;
  if (it.limit <= 3) return 1; // سهمیه‌ی کوچک: فقط آخرین دانه
  return Math.max(2, Math.ceil(it.limit * 0.15));
};

/** جمله‌ی هشدارِ روی مسیر — کوتاه، بدونِ تعارف، با عدد. */
export const lowWarning = (it: QuotaItem): string => {
  const n = it.remaining ?? 0;
  if (it.scope === 'lifetime') {
    return n === 1
      ? `این آخرین ${QUOTA_META[it.key].label}ِ رایگانِ توست.`
      : `فقط ${faNum(n)} ${QUOTA_META[it.key].label}ِ رایگان مانده.`;
  }
  return n === 1
    ? `آخرین ${QUOTA_META[it.key].label}ِ امروزت است.`
    : `${faNum(n)} ${QUOTA_META[it.key].label}ِ دیگر تا پایانِ سهمِ امروز.`;
};
