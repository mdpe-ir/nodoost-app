import type { AppLockRecord } from '@/core/storage/appLockStorage';

/**
 * سیاستِ قفلشدن — خالص و تست‌پذیر، بدونِ هیچ وابستگی به RN یا ذخیرهسازی.
 *
 * الگوی تلگرام: برگشتن از پسزمینه اگر بیشتر از «مهلتِ بخشش» طول کشیده باشد
 * یعنی قفل. مهلتِ پیش‌فرض صفر است (همان‌وقت که اپ از دید خارج شد، برگشت قفل
 * است)؛ اگر تجربه نشان داد کاربر جابهجاییِ سریع بین اپها آزاردهنده شده، با
 * همین ورودی می‌توان مهلت را بالا برد بدونِ دستزدن به ساختار.
 */
export const APP_LOCK_DEFAULT_GRACE_MS = 0;

export interface AppLockDecisionInput {
  /** رکوردِ قفل تنظیم شده باشد. */
  record: AppLockRecord | null;
  /** آخرین باری که اپ به پسزمینه رفت — `null` یعنی از شروعِ پردازه هنوز نه. */
  backgroundedAt: number | null;
  now: number;
  graceMs?: number;
}

export const shouldAppLock = ({
  record,
  backgroundedAt,
  now,
  graceMs = APP_LOCK_DEFAULT_GRACE_MS,
}: AppLockDecisionInput): boolean => {
  if (!record) return false;
  if (backgroundedAt === null) return true;
  return now - backgroundedAt >= graceMs;
};
