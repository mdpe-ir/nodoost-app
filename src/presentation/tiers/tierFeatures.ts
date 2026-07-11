import type { Tier } from '@/domain/entities';
import type { IconName } from '@/presentation/components/Icon';
import { faNum } from '@/core/utils/faNum';

/**
 * منبعِ واحدِ «هر سطح چه چیزی باز می‌کند» — از فیلدهای امکاناتِ تایر (که سرور در
 * ‎/api/tiers‎ برمی‌گرداند) یک فهرستِ نمایشی می‌سازد. همه‌ی سطح‌ها همین ردیف‌ها را
 * دارند تا جدولِ مقایسه ستون‌به‌ستون هم‌تراز شود. کارتِ پلن، صفحه‌ی سطح‌ها و
 * پنجره‌ی ارتقا همگی از همین‌جا تغذیه می‌شوند.
 */

export interface TierFeature {
  key: string;
  icon: IconName;
  /** توضیحِ امکان. */
  label: string;
  /** مقدارِ همین امکان برای این سطح (مثلاً «۳۰ در روز» یا «نامحدود»). */
  value: string;
  /** آیا این امکان برای این سطح فعال/معنادار است (برای تیک/ضربدر و کم‌رنگی). */
  enabled: boolean;
}

interface Row {
  key: string;
  icon: IconName;
  label: string;
  value: (t: Tier) => string;
  enabled: (t: Tier) => boolean;
}

/** سقفِ روزانه؛ null = نامحدود. */
const perDay = (n: number | null): string => (n == null ? 'نامحدود' : `${faNum(n)} در روز`);

/**
 * سقفِ تعدادِ عکس به‌ازای سطحِ مؤثر — آینه‌ی maxPhotosFor در بک‌اند
 * (photos/handler.go): عادی۳ برنزی۵ نقره‌ای۸ طلایی۱۲ الماس۱۵.
 */
export const maxPhotosForTier = (level: number): number => {
  if (level >= 5) return 15;
  if (level === 4) return 12;
  if (level === 3) return 8;
  if (level === 2) return 5;
  return 3;
};

export const TIER_FEATURE_ROWS: Row[] = [
  {
    key: 'conversation',
    icon: 'send-fill',
    label: 'شروعِ گفتگو',
    value: (t) => perDay(t.dailyConversationLimit),
    enabled: () => true,
  },
  {
    key: 'random',
    icon: 'lightning-fill',
    label: 'چتِ شانسی',
    value: (t) => perDay(t.dailyRandomLimit),
    enabled: () => true,
  },
  {
    key: 'likes',
    icon: 'heart-fill',
    label: 'دیدنِ پسندکنندگان',
    value: (t) => (t.canSeeLikes ? 'دارد' : 'ندارد'),
    enabled: (t) => t.canSeeLikes,
  },
  {
    key: 'super',
    icon: 'star',
    label: 'سوپرلایک',
    value: (t) => (t.superLikesPerDay > 0 ? perDay(t.superLikesPerDay) : '—'),
    enabled: (t) => t.superLikesPerDay > 0,
  },
  {
    key: 'gender',
    icon: 'filter',
    label: 'فیلترِ جنسیت در چتِ شانسی',
    value: (t) => (t.canFilterRandomGender ? 'دارد' : 'ندارد'),
    enabled: (t) => t.canFilterRandomGender,
  },
  {
    key: 'radius',
    icon: 'map',
    label: 'شعاعِ جست‌وجو',
    value: (t) => (t.maxRadiusKm > 0 ? `${faNum(t.maxRadiusKm)} کیلومتر` : '—'),
    enabled: (t) => t.maxRadiusKm > 0,
  },
  {
    key: 'boost',
    icon: 'lightning',
    label: 'بوستِ ماهانه',
    value: (t) => (t.boostPerMonth > 0 ? `${faNum(t.boostPerMonth)} بار` : '—'),
    enabled: (t) => t.boostPerMonth > 0,
  },
  {
    key: 'photos',
    icon: 'edit',
    label: 'تعدادِ عکس',
    value: (t) => `${faNum(maxPhotosForTier(t.level))} عکس`,
    enabled: () => true,
  },
];

/** فهرستِ امکاناتِ یک سطح — برای جدولِ مقایسه و کارتِ کامل. */
export const tierFeatures = (t: Tier): TierFeature[] =>
  TIER_FEATURE_ROWS.map((r) => ({
    key: r.key,
    icon: r.icon,
    label: r.label,
    value: r.value(t),
    enabled: r.enabled(t),
  }));

/**
 * بولت‌های «چرا این پلن» — پرک‌های دستیِ PM اولویت دارند؛ اگر تعریف نشده باشند،
 * از امکاناتِ فعالِ همان سطح یک فهرست می‌سازیم تا کارت هیچ‌وقت خالی نماند.
 */
export const tierPerks = (t: Tier): string[] =>
  t.perks.length ? t.perks : tierFeatures(t).filter((f) => f.enabled).map((f) => `${f.label}: ${f.value}`);
