import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * لمسِ بازخوردی — لایه‌ی نازکی روی expo-haptics.
 *
 * دو کارِ لازم را می‌کند که صداکردنِ مستقیمِ expo-haptics نمی‌کند:
 * ۱) روی وب/PWA بی‌صدا رد می‌شود (آن‌جا Taptic Engine وجود ندارد و فراخوانی
 *    خطا می‌دهد)، پس صفحه‌ها لازم نیست هر بار Platform را چک کنند.
 * ۲) خطاها را می‌بلعد. لرزش هیچ‌وقت آن‌قدر مهم نیست که جریانِ کاربر را بشکند —
 *    اگر دستگاه موتورِ لرزش نداشته باشد، کنش باید بی‌سروصدا ادامه پیدا کند.
 *
 * نام‌ها عمداً بر اساسِ «معنا» است نه «شدت»: جای صدازدن، معنیِ لحظه را انتخاب
 * می‌کنی، و شدت یک‌جا اینجا تنظیم می‌شود.
 */

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

const safe = (fn: () => Promise<unknown>) => {
  if (!enabled) return;
  fn().catch(() => {});
};

export const haptics = {
  /** انتخابِ سبک — تبِ جدید، چیپ، سوییچ. پرتکرارترین و باید نامحسوس باشد. */
  select: () => safe(() => Haptics.selectionAsync()),

  /** فشردنِ دکمه‌ی معمولی. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** عبور از آستانه — کارت به نقطه‌ی پسند/رد رسید، برگه قفل شد. */
  threshold: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** کنشِ سنگین و برگشت‌ناپذیر — پرتابِ کارت، تأیید خرید. */
  commit: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  /** کار انجام شد — پیام رفت، پروفایل ذخیره شد. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /** چیزی درست نیست — سقفِ سهمیه، اعتبارسنجیِ ناموفق. */
  warn: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  /** خطا. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

/**
 * نسخه‌ی قابلِ صدازدن از داخلِ worklet (ژست‌ها روی ترد UI اجرا می‌شوند و
 * نمی‌توانند مستقیم به ماژولِ بومی وصل شوند). داخلِ worklet این‌طور صدا بزن:
 * `runOnJS(hapticThreshold)()`
 */
export const hapticThreshold = () => haptics.threshold();
export const hapticCommit = () => haptics.commit();
export const hapticSelect = () => haptics.select();
