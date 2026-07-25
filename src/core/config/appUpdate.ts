import { Linking, Platform } from 'react-native';

/**
 * نسخه‌ی اپِ اندروید — از `GET /api/config` می‌آید و از پنلِ ادمین تنظیم می‌شود.
 *
 * دو سطحِ به‌روزرسانی داریم:
 *   • اجباری  — نصب‌شده < `min_android_version` ⇒ دروازه‌ی تمام‌صفحه (UpdateGateProvider).
 *   • اختیاری — نصب‌شده < `latest_version`      ⇒ فقط پیشنهاد در «درباره‌ی برنامه».
 *
 * (به‌روزرسانیِ OTA جداست: بسته‌ی JS را expo-updates بی‌صدا می‌گیرد و به نسخه‌ی
 * نیتیو کاری ندارد. این‌جا فقط از نصبِ نسخه‌ی جدیدِ APK حرف می‌زنیم.)
 *
 * سیاست در هر دو حالت fail-safe است: اگر فیلد نبود یا درخواست شکست خورد، هیچ
 * چیزی به کاربر نشان داده نمی‌شود.
 */
const PKG = 'com.nodoost.app';
export const DEFAULT_STORE_URL = `https://cafebazaar.ir/app/${PKG}`;
const DEEP_LINK = `bazaar://details?id=${PKG}`;

export interface VersionConfig {
  /** پایین‌ترین نسخه‌ی مجاز؛ پایین‌تر از آن، ادامه‌ی استفاده مسدود می‌شود. */
  minAndroidVersion: string;
  /** آخرین نسخه‌ی منتشرشده؛ مبنای پیشنهادِ به‌روزرسانیِ اختیاری. */
  latestVersion: string;
  storeUrl: string;
}

export const emptyVersionConfig: VersionConfig = {
  minAndroidVersion: '',
  latestVersion: '',
  storeUrl: DEFAULT_STORE_URL,
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** فیلدهای نسخه را از پاسخِ خامِ `/api/config` بیرون می‌کشد. */
export function parseVersionConfig(raw: unknown): VersionConfig {
  if (!raw || typeof raw !== 'object') return emptyVersionConfig;
  const o = raw as Record<string, unknown>;
  return {
    minAndroidVersion: str(o.min_android_version),
    latestVersion: str(o.latest_version),
    storeUrl: str(o.store_url) || DEFAULT_STORE_URL,
  };
}

/** مقایسه‌ی نسخه‌های نقطه‌ای مثل «۲.۳.۶» — منفی اگر a < b. */
export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * آیا نسخه‌ی تازه‌تری از نسخه‌ی نصب‌شده منتشر شده است؟
 *
 * فقط اندرویدِ نیتیو: وب/PWA همیشه آخرین نسخه را از سرور می‌گیرد و iOS بازار ندارد،
 * پس آن‌جا پیشنهادِ نصب بی‌معناست.
 */
export function isUpdateAvailable(installed: string | null | undefined, latest: string): boolean {
  if (Platform.OS !== 'android') return false;
  if (!installed || !latest) return false;
  return cmpVersion(installed, latest) < 0;
}

/** اول با دیپ‌لینکِ بازار، و اگر بازار نصب نبود با آدرسِ وب. */
export async function openStore(storeUrl: string = DEFAULT_STORE_URL) {
  try {
    if (await Linking.canOpenURL(DEEP_LINK)) {
      await Linking.openURL(DEEP_LINK);
      return;
    }
  } catch {
    /* fallback زیر */
  }
  Linking.openURL(storeUrl).catch(() => {});
}
