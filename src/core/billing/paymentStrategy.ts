import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * درگاهِ پرداختِ فعّال بر اساسِ نحوه‌ی توزیع:
 *  - وب/PWA → زرین‌پال (بازآوردِ مرورگر).
 *  - بیلدِ اندرویدِ کافه‌بازار → خریدِ درون‌برنامه‌ای (Poolakey).
 *
 * پرچمِ `distribution` هنگامِ build از `app.json` → `extra.distribution` خوانده می‌شود
 * (یا با متغیرِ محیطیِ EXPO_PUBLIC_DISTRIBUTION در زمانِ build). پیش‌فرض: زرین‌پال.
 */
export type PaymentMode = 'zarinpal' | 'bazaar';

// env-first: پرچمِ توزیع در زمانِ build توسطِ EXPO_PUBLIC_DISTRIBUTION تعیین می‌شود
// (برای APKِ بازار: EXPO_PUBLIC_DISTRIBUTION=bazaar). extra صرفاً پیش‌فرضِ پشتیبان است.
const distribution = String(
  process.env.EXPO_PUBLIC_DISTRIBUTION ??
    Constants.expoConfig?.extra?.distribution ??
    'default'
).toLowerCase();

export function getPaymentMode(): PaymentMode {
  // فقط بیلدِ نیتیوِ اندروید که برای کافه‌بازار ساخته شده از IAB استفاده می‌کند.
  if (Platform.OS === 'android' && distribution === 'bazaar') return 'bazaar';
  return 'zarinpal';
}

export const isBazaarBuild = getPaymentMode() === 'bazaar';
