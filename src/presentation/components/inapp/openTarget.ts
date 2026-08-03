import { Linking } from 'react-native';
import { router } from 'expo-router';

/**
 * مقصدِ دکمه‌ی یک پیامِ درون‌برنامه‌ای را باز می‌کند.
 *
 * ادمین در پنل یا مسیرِ داخلی می‌نویسد (`/plans`، `/user/12`) یا لینکِ کامل.
 * هر چیزِ دیگری نادیده گرفته می‌شود — نه خطا می‌دهد و نه اپ را جای عجیبی می‌برد.
 */
export function openTarget(url?: string): void {
  const target = url?.trim();
  if (!target) return;

  if (target.startsWith('/')) {
    router.push(target as never);
    return;
  }
  if (/^https?:\/\//i.test(target)) {
    void Linking.openURL(target).catch(() => {});
  }
}
