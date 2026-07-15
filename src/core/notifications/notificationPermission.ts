// درخواستِ Runtimeِ مجوزِ نمایشِ اعلان برای Android 13+ (API 33 / TIRAMISU).
//
// Fetchy SDK اعلان‌ها را با WorkManager نمایش می‌دهد، ولی در اندروید ۱۳ به بالا اگر
// مجوزِ POST_NOTIFICATIONS از کاربر گرفته نشده باشد، اعلانی روی دستگاه دیده نمی‌شود.
// (خودِ مجوز در manifestِ SDK اعلان شده و merge می‌شود؛ این‌جا فقط prompt می‌زنیم.)
// روی وب و iOS این تابع بی‌اثر است.
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // POST_NOTIFICATIONS فقط از API 33 معنا دارد؛ در نسخه‌های پایین‌تر مجوز ضمنی است.
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return;

  try {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permission) return; // روی نسخه‌ی react-native بدونِ این ثابت، بی‌صدا رد شو
    const already = await PermissionsAndroid.check(permission);
    if (already) return;
    await PermissionsAndroid.request(permission);
  } catch {
    // رد شدنِ کاربر یا نبودِ مجوز نباید اپ را بشکند.
  }
}
