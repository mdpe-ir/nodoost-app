import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * نگهداریِ رکوردِ قفلِ برنامه — سطحِ دستگاه، نه سطحِ اکانت.
 *
 * چرا سطحِ دستگاه: قفل جلوی «کسی که گوشی را برداشته» را می‌گیرد، پیش از آن‌که
 * اصلاً معلوم شود کدام اکانت قرار است باز شود. پس رکوردش هم بیرون از
 * `AccountStorage` و با کلیدِ مستقل و نسخه‌دار (`_v1`) نگه داشته می‌شود —
 * هم‌سبک با `prefs.ts`.
 *
 * داخلِ رکورد هیچ‌وقت رمزِ خام نیست: نمک و هش و «طولِ مورد انتظار» (تا کیپد
 * بداند کِی خودکار ثبت کند؛ از هش نمی‌توان طول را درآورد).
 */

export type AppLockType = 'pin' | 'pattern';

export interface AppLockRecord {
  type: AppLockType;
  salt: string;
  hash: string;
  /** طولِ رازِ ثبت‌شده: تعدادِ رقم برای pin، تعدادِ نقطه برای pattern. */
  length: number;
  createdAt: number;
  /**
   * میانبرِ بیومتریک. رازِ واقعی همان رمزِ عددی/الگوست؛ اثر انگشت فقط
   * دکمه‌ی میانبرِ بازکردن است، پس پرچمش هم کنارِ همین رکورد می‌ماند و با
   * برداشتنِ قفل خودبهخود می‌رود.
   */
  biometricEnabled: boolean;
}

const KEY = 'nd_app_lock_v1';
const web = Platform.OS === 'web';

export const readAppLockRecord = async (): Promise<AppLockRecord | null> => {
  try {
    const raw = web
      ? (globalThis.localStorage?.getItem(KEY) ?? null)
      : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppLockRecord>;
    if (parsed.type !== 'pin' && parsed.type !== 'pattern') return null;
    if (typeof parsed.salt !== 'string' || typeof parsed.hash !== 'string') return null;
    if (typeof parsed.length !== 'number' || parsed.length < 4) return null;
    return {
      type: parsed.type,
      salt: parsed.salt,
      hash: parsed.hash,
      length: parsed.length,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : 0,
      // رکوردهای پیش از بیومتریک این فیلد را ندارند — پیش‌فرض خاموش.
      biometricEnabled: parsed.biometricEnabled === true,
    };
  } catch {
    return null;
  }
};

export const writeAppLockRecord = async (record: AppLockRecord): Promise<void> => {
  const raw = JSON.stringify(record);
  try {
    if (web) {
      globalThis.localStorage?.setItem(KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(KEY, raw);
  } catch {
    /* قفل ناتمام می‌ماند؛ بهتر از کرش */
  }
};

export const clearAppLockRecord = async (): Promise<void> => {
  try {
    if (web) {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* حذفِ ناموفق در دفعه‌ی بعد دوباره تلاش می‌شود */
  }
};
