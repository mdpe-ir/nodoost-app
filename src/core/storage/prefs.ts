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
const web = Platform.OS === 'web';

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

/** آیا کاربر تورِ معرفیِ نودوست را دیده است؟ (فقط سمتِ کلاینت) */
export const welcomeSeenStorage = {
  get: () => readFlag(WELCOME_SEEN),
  markSeen: () => writeFlag(WELCOME_SEEN, true),
};
