/**
 * سهمیه‌ی کاربر — «چقدر مانده»، *قبل* از برخورد به سقف.
 *
 * چرا مهم است: تا پیش از این تنها راهِ فهمیدنِ وجودِ سقف، خوردن به آن بود؛
 * بیشترین سردرگمیِ کاربران هم دقیقاً همین بود. سرور این اعداد را می‌دهد و اپ
 * فقط روایتشان می‌کند — هیچ سقفی سمتِ اپ دوباره حساب نمی‌شود.
 */

/** کلیدِ سهمیه؛ با خطاهای ۴۰۲ سرور هم‌خانواده است. */
export type QuotaKey = 'conversation' | 'random' | 'like';

/** بازه‌ی سهمیه — `lifetime` یعنی «تازه نمی‌شود» (سهمِ رایگانِ یک‌بارِ حساب). */
export type QuotaScope = 'daily' | 'lifetime';

export interface QuotaItem {
  key: QuotaKey;
  scope: QuotaScope;
  used: number;
  /** null = نامحدود. */
  limit: number | null;
  /** null = نامحدود. هرگز منفی نیست. */
  remaining: number | null;
  unlimited: boolean;
  /** پایین‌ترین سطحی که همین سهمیه را بالا می‌برد؛ undefined یعنی ارتقا کمکی نمی‌کند. */
  unlockTier?: number;
  /** سقفِ همان سطح (اگر نامحدود نباشد). */
  unlockLimit?: number;
  unlockUnlimited?: boolean;
}

export interface Quota {
  tier: number;
  isPlus: boolean;
  subscriptionUntil?: string;
  daysLeft: number;
  /** ابتدای فردا به وقتِ تهران — مبنای «تا x ساعتِ دیگر تازه می‌شود». */
  resetsAt?: string;
  items: QuotaItem[];
}

/** یک سهمیه را از بسته بیرون می‌کشد (بدونِ آن، هر مصرف‌کننده find می‌نویسد). */
export const quotaOf = (q: Quota | null, key: QuotaKey): QuotaItem | undefined =>
  q?.items.find((i) => i.key === key);
