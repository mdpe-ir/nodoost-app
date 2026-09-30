/**
 * سقفِ اکانت‌های همزمانِ یک دستگاه — از `GET /api/config` (`accounts`).
 *
 * این عدد فقط برای UI است (نشان‌دادنِ ردیفِ «افزودن حساب» و پیامِ «سقف پر
 * است»). سقفِ واقعی را سرور هنگامِ `verify-otp` میسنجد؛ کلاینتی که این عدد
 * را نادیده بگیرد، از سمتِ سرور رد می‌شود.
 */
export interface AccountsConfig {
  maxAccounts: number;
}

/** پیش‌فرضِ محلی اگر `/config` نیاید — هم‌راستا با پیش‌فرضِ سرور (`max_accounts_per_device = 3`). */
export const defaultAccountsConfig = (): AccountsConfig => ({ maxAccounts: 3 });

export const parseAccountsConfig = (raw: unknown): AccountsConfig => {
  const base = defaultAccountsConfig();
  if (!raw || typeof raw !== 'object') return base;
  // سرور در `/api/config` این را زیرِ `accounts: { max }` می‌فرستد.
  const v = (raw as Record<string, unknown>).max;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 1) {
    // سقفِ منطقی: عددِ بی‌معنا از پنل نباید UI را خراب کند.
    return { maxAccounts: Math.min(20, Math.floor(v)) };
  }
  return base;
};
