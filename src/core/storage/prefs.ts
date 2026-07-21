import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * ترجیح‌های سبکِ سمتِ کلاینت (غیرِ محرمانه) — مثلِ «تورِ معرفی را دیده‌ای؟».
 * روی وب با localStorage و روی نیتیو با SecureStore نگه‌داری می‌شود؛
 * هم‌سبک با TokenStorage تا وابستگیِ تازه‌ای لازم نشود.
 *
 * کلید نسخه‌دار است (`_v1`)؛ اگر بعدها تورِ معرفی به‌کل بازطراحی شد،
 * با افزایشِ شماره‌ی نسخه می‌توان دوباره به همه‌ی کاربران نشانش داد.
 */
const WELCOME_SEEN = 'nd_welcome_seen_v1';
const LOCATION_PRIMER = 'nd_location_primer_v1';
const web = Platform.OS === 'web';

/** فاصله‌ی دوباره‌پرسیدنِ مجوزِ موقعیت بعد از «الان نه» — یک هفته. */
const PRIMER_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

async function readFlag(key: string): Promise<boolean> {
  try {
    if (web) return globalThis.localStorage?.getItem(key) === '1';
    return (await SecureStore.getItemAsync(key)) === '1';
  } catch {
    return false;
  }
}

async function writeFlag(key: string, value: boolean): Promise<void> {
  try {
    if (web) {
      globalThis.localStorage?.setItem(key, value ? '1' : '0');
      return;
    }
    await SecureStore.setItemAsync(key, value ? '1' : '0');
  } catch {}
}

async function readValue(key: string): Promise<string | null> {
  try {
    if (web) return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeValue(key: string, value: string): Promise<void> {
  try {
    if (web) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

/** آیا کاربر تورِ معرفیِ نودوست را دیده است؟ (فقط سمتِ کلاینت) */
export const welcomeSeenStorage = {
  get: () => readFlag(WELCOME_SEEN),
  markSeen: () => writeFlag(WELCOME_SEEN, true),
};

/**
 * وضعیتِ «پیش‌پرسشِ موقعیت» — پنجره‌ی نرمی که پیش از دیالوگِ سیستمی دلیلش را توضیح می‌دهد.
 * مقدارِ ذخیره‌شده یا `done` است (دیگر هرگز نپرس) یا زمانِ آخرین «الان نه» بر حسبِ میلی‌ثانیه.
 *
 * چرا زمان و نه یک پرچمِ ساده؟ چون ردِ یک‌باره نباید برای همیشه راهِ مچ‌های نزدیک را ببندد؛
 * اما پرسیدنِ دوباره در هر بار باز شدنِ اپ هم آزاردهنده است. یک هفته وقفه، میانه‌ی درست است.
 */
export const locationPrimerStorage = {
  /** آیا الان می‌شود پیش‌پرسش را نشان داد؟ (نه اگر قبلاً تمام شده یا تازه رد شده) */
  async shouldAsk(): Promise<boolean> {
    const v = await readValue(LOCATION_PRIMER);
    if (v === 'done') return false;
    const at = Number(v);
    if (!v || !Number.isFinite(at) || at <= 0) return true;
    return Date.now() - at > PRIMER_SNOOZE_MS;
  },
  /** مجوز گرفته شد (یا از قبل بود) — دیگر نپرس. */
  markDone: () => writeValue(LOCATION_PRIMER, 'done'),
  /** کاربر «الان نه» زد — یک هفته ساکت بمان. */
  snooze: () => writeValue(LOCATION_PRIMER, String(Date.now())),
};
