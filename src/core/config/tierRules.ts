/**
 * قانون‌های سطحِ رایگان — همان چیزی که سرور در `GET /api/config` زیرِ `rules`
 * می‌دهد و ادمین در پنل ویرایشش می‌کند.
 *
 * چرا لازم است: سطحِ ۱ (عادی) ردیفی در جدولِ tiers ندارد، پس در ‎/api/tiers‎ هم
 * نمی‌آید. بدونِ این، جدولِ مقایسه ستونِ «رایگان» نداشت و کاربر هیچ‌جا نمی‌دید
 * که با حسابِ رایگانش دقیقاً چه چیزی دارد — یکی از همان سردرگمی‌هایی که این
 * بازطراحی برای رفعش انجام شد.
 */
export interface TierRules {
  freeConversationLimit: number;
  freeDailyRandomLimit: number;
  freeDailySwipeLimit: number;
}

/** با مقدارهای پیش‌فرضِ بک‌اند (tiers.DefaultRules) هم‌خوان است. */
export const defaultTierRules: TierRules = {
  freeConversationLimit: 1,
  freeDailyRandomLimit: 3,
  freeDailySwipeLimit: 30,
};

const int = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;

export const parseTierRules = (raw: unknown): TierRules => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    freeConversationLimit: int(r.free_conversation_limit, defaultTierRules.freeConversationLimit),
    freeDailyRandomLimit: int(r.free_daily_random_limit, defaultTierRules.freeDailyRandomLimit),
    freeDailySwipeLimit: int(r.free_daily_swipe_limit, defaultTierRules.freeDailySwipeLimit),
  };
};
