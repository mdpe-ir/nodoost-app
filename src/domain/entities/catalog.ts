/** سطحِ عضویت (تایر) برای نمایش و خرید. */
export interface Tier {
  id: string;
  level: number;
  name: string;
  priceToman?: number;
  amountRial?: number;
  /** SKUِ محصولِ درون‌برنامه‌ای در کافه‌بازار (اگر خالی باشد، همان id/code). */
  bazaarSku?: string;
  /** مدتِ اعتبارِ اشتراک به روز. */
  days?: number;
  /** بولت‌های توضیحیِ سطح (قابلِ ویرایش در پنلِ ادمین). */
  perks: string[];
  /** سقفِ سوایپِ روزانه؛ null = نامحدود. */
  dailySwipeLimit: number | null;
  /** سقفِ شروعِ گفتگو در روز؛ null = نامحدود. */
  dailyConversationLimit: number | null;
  /** سقفِ چتِ شانسی در روز؛ null = نامحدود. */
  dailyRandomLimit: number | null;
  superLikesPerDay: number;
  /** دیدنِ فهرستِ کاملِ پسندکنندگان. */
  canSeeLikes: boolean;
  /** فیلترِ جنسیت در چتِ شانسی. */
  canFilterRandomGender: boolean;
  maxRadiusKm: number;
  boostPerMonth: number;

  /**
   * قابلِ خرید بودنِ این سطح برای همین کاربر. سرور تصمیم می‌گیرد، نه اپ:
   * سطحِ پایین‌تر از اشتراکِ فعال خریدنی نیست.
   *
   * پیش‌فرض true است تا اگر بک‌اند قدیمی‌تر از اپ بود (یا فیلد نیامد) هیچ کارتی
   * بی‌دلیل قفل نشود.
   */
  purchasable: boolean;
  /** کلیدِ ماشین‌خوانِ دلیلِ قفل (فعلاً فقط `lower_than_active`). */
  blockReason?: string;
  /** متنِ فارسیِ آماده‌ی نمایش روی کارتِ قفل‌شده. */
  blockMessage?: string;
  /** روزهای همین سطح که در صف منتظرند (اشتراکی که خریده و هنوز شروع نشده). */
  queuedDaysLeft?: number;
}

/** یک اشتراکِ خریداری‌شده که پشتِ اشتراکِ فعال در صف است. */
export interface QueuedSubscription {
  tierLevel: number;
  daysRemaining: number;
  /** زمانِ پیش‌بینی‌شده‌ی شروع — با تغییرِ صف جابه‌جا می‌شود. */
  startsAt?: string;
  endsAt?: string;
}

/**
 * چه اتفاقی برای اشتراک افتاد. سرور تصمیم می‌گیرد و اپ فقط روایتش می‌کند —
 * اپ نباید از روی سطحِ قبلی و جدید حدس بزند، چون فقط سرور صفِ واقعی را می‌بیند.
 */
export type PurchaseOutcome =
  | 'activated' // اشتراکِ تازه
  | 'renewed' // تمدیدِ همان سطح
  | 'upgraded' // ارتقا؛ روزهای قبلی حفظ و به صف رفتند
  | 'queued' // سطحِ پایین‌تر؛ پشتِ اشتراکِ فعال نشست
  | 'unchanged'; // رسیدِ تکراری

export interface PurchaseResult {
  outcome?: PurchaseOutcome;
  /** سطحِ مؤثر پس از خرید. */
  tier?: number;
  /** انقضای اشتراکِ فعال. */
  subscriptionUntil?: string;
  /** پایانِ پیش‌بینی‌شده‌ی همین خرید (برای خریدِ در صف با بالایی فرق دارد). */
  grantedUntil?: string;
  /** صفِ پس از این خرید — «بعد از این، نقره‌ای ۱۲ روز». */
  deferred: QueuedSubscription[];
  /** رسید از قبل پردازش شده بود. */
  already: boolean;
}
