/**
 * دروازه‌ی «قفلِ برنامه» — از `GET /api/config` (`app_lock`).
 *
 * ارزیابی سمتِ اپ فقط برای UI است: نمایش/پنهان‌کردنِ ردیف و دامنه‌ی رقم‌ها.
 * **رمز هرگز به سرور نمی‌رود**؛ این پیکربندی فقط می‌گوید قابلیت در این نسخه
 * روشن است یا نه و چه شکلی دارد.
 */
export interface AppLockConfig {
  enabled: boolean;
  /** اگر true باشد کاربر نمی‌تواند قفل را خاموش کند (سیاستِ پشتیبانی). */
  force: boolean;
  minDigits: number;
  maxDigits: number;
  allowPattern: boolean;
}

/** پیش‌فرضِ محلی: روشن، اختیاری، ۴ تا ۶ رقم، الگو مجاز. */
export const defaultAppLockConfig = (): AppLockConfig => ({
  enabled: true,
  force: false,
  minDigits: 4,
  maxDigits: 6,
  allowPattern: true,
});

const clampInt = (v: unknown, fallback: number, lo: number, hi: number): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.min(hi, Math.max(lo, Math.floor(v)))
    : fallback;

export const parseAppLockConfig = (raw: unknown): AppLockConfig => {
  const base = defaultAppLockConfig();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  // ۴ کمینه‌ی استانداردِ تلگرام است؛ بالاتر از ۸ رقم هم روی کیپد بی‌معناست.
  const minDigits = clampInt(o.min_digits, base.minDigits, 4, 8);
  const maxDigits = Math.max(minDigits, clampInt(o.max_digits, base.maxDigits, minDigits, 8));
  return {
    enabled: o.enabled !== false,
    force: o.force === true,
    minDigits,
    maxDigits,
    allowPattern: o.allow_pattern !== false,
  };
};
