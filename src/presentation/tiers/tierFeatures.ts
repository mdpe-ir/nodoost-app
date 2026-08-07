import type { Tier } from '@/domain/entities';
import type { IconName } from '@/presentation/components/Icon';
import type { TierRules } from '@/core/config/tierRules';
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
  /**
   * عددِ قابلِ مقایسه‌ی همین امکان — تنها مبنای «چه چیزی نسبت به سطحِ فعلی‌ات
   * بهتر می‌شود». نامحدود = بی‌نهایت، بولی = ۰/۱. بدونِ این، فهرستِ «چه چیزی
   * اضافه می‌شود» باید با if‌های دستی برای هر امکان نوشته می‌شد و اولین امکانِ
   * تازه‌ای که PM اضافه می‌کرد از قلم می‌افتاد.
   */
  rank: (t: Tier) => number;
}

const cap = (n: number | null): number => (n == null ? Number.POSITIVE_INFINITY : n);

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
    value: (t) => (t.level <= 1 ? freeConversationValue(t) : perDay(t.dailyConversationLimit)),
    enabled: () => true,
    rank: (t) => cap(t.dailyConversationLimit),
  },
  {
    key: 'random',
    icon: 'lightning-fill',
    label: 'چتِ شانسی',
    value: (t) => perDay(t.dailyRandomLimit),
    enabled: () => true,
    rank: (t) => cap(t.dailyRandomLimit),
  },
  {
    key: 'likes',
    icon: 'heart-fill',
    label: 'دیدنِ پسندکنندگان',
    value: (t) => (t.canSeeLikes ? 'دارد' : 'ندارد'),
    enabled: (t) => t.canSeeLikes,
    rank: (t) => (t.canSeeLikes ? 1 : 0),
  },
  {
    key: 'swipe',
    icon: 'heart-fill',
    label: 'پسندِ روزانه',
    value: (t) => perDay(t.dailySwipeLimit),
    enabled: () => true,
    rank: (t) => cap(t.dailySwipeLimit),
  },
  {
    key: 'super',
    icon: 'star',
    label: 'سوپرلایک',
    value: (t) => (t.superLikesPerDay > 0 ? perDay(t.superLikesPerDay) : '—'),
    enabled: (t) => t.superLikesPerDay > 0,
    rank: (t) => t.superLikesPerDay,
  },
  {
    key: 'gender',
    icon: 'filter',
    label: 'فیلترِ جنسیت در چتِ شانسی',
    value: (t) => (t.canFilterRandomGender ? 'دارد' : 'ندارد'),
    enabled: (t) => t.canFilterRandomGender,
    rank: (t) => (t.canFilterRandomGender ? 1 : 0),
  },
  {
    key: 'radius',
    icon: 'map',
    label: 'شعاعِ جست‌وجو',
    value: (t) => (t.maxRadiusKm > 0 ? `${faNum(t.maxRadiusKm)} کیلومتر` : '—'),
    enabled: (t) => t.maxRadiusKm > 0,
    rank: (t) => t.maxRadiusKm,
  },
  {
    key: 'boost',
    icon: 'lightning',
    label: 'بوستِ ماهانه',
    value: (t) => (t.boostPerMonth > 0 ? `${faNum(t.boostPerMonth)} بار` : '—'),
    enabled: (t) => t.boostPerMonth > 0,
    rank: (t) => t.boostPerMonth,
  },
  {
    key: 'photos',
    icon: 'edit',
    label: 'تعدادِ عکس',
    value: (t) => `${faNum(maxPhotosForTier(t.level))} عکس`,
    enabled: () => true,
    rank: (t) => maxPhotosForTier(t.level),
  },
];

/**
 * سهمِ گفتگوی سطحِ رایگان *روزانه نیست* — کلاً یک‌بار در عمرِ حساب است
 * (chat/handler.go کلِ گفتگوهای آغازشده را می‌شمارد، نه گفتگوهای امروز).
 * نوشتنِ «۱ در روز» روی ستونِ رایگان یعنی همان انتظارِ غلطی که کاربر را
 * منتظرِ فردایی می‌گذاشت که هرگز نمی‌آمد.
 */
const freeConversationValue = (t: Tier): string =>
  t.dailyConversationLimit == null
    ? 'نامحدود'
    : `${faNum(t.dailyConversationLimit)} بار (یک‌بار برای همیشه)`;

/**
 * ستونِ «عادی (رایگان)» را می‌سازد. سطحِ ۱ ردیفی در جدولِ tiers ندارد، پس در
 * ‎/api/tiers‎ هم نمی‌آید؛ سقف‌هایش از `rules`ِ ‎/api/config‎ می‌آید و بقیه‌ی
 * امکانات طبقِ تعریف خاموش‌اند.
 */
export const freeTier = (rules: TierRules): Tier => ({
  id: 'free',
  level: 1,
  name: 'عادی',
  priceToman: 0,
  perks: [],
  dailySwipeLimit: rules.freeDailySwipeLimit,
  dailyConversationLimit: rules.freeConversationLimit,
  dailyRandomLimit: rules.freeDailyRandomLimit,
  superLikesPerDay: 0,
  canSeeLikes: false,
  canFilterRandomGender: false,
  // آینه‌ی tiers.FreeMaxRadiusKm در بک‌اند.
  maxRadiusKm: 30,
  boostPerMonth: 0,
  purchasable: false,
});

/** یک تفاوتِ ملموس بینِ سطحِ فعلی و سطحِ هدف. */
export interface TierGain {
  key: string;
  icon: IconName;
  label: string;
  from: string;
  to: string;
}

/**
 * «با این ارتقا دقیقاً چه چیزی بهتر می‌شود» — فقط ردیف‌هایی که واقعاً بالا
 * می‌روند. قاب‌بندیِ تفاوتی مهم‌ترین چیزی است که کاربر می‌خواهد بداند؛ فهرستِ
 * کاملِ امکانات (که بیشترش با سطحِ فعلی یکی است) این پیام را گم می‌کند.
 */
export const tierGains = (current: Tier, target: Tier): TierGain[] =>
  TIER_FEATURE_ROWS.filter((r) => r.rank(target) > r.rank(current)).map((r) => ({
    key: r.key,
    icon: r.icon,
    label: r.label,
    from: r.value(current),
    to: r.value(target),
  }));

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
