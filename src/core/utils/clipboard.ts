import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * رونوشت با فالبکِ امن برای باینری‌های قدیمی.
 *
 * مسئله: `expo-clipboard` یک ماژولِ نیتیو است و بسته‌ی JS آن در همان خطِ اول
 * `requireNativeModule('ExpoClipboard')` را صدا می‌زند — یعنی صرفِ `import`
 * کردنش روی APKیی که این ماژول را ندارد، *پرتاب می‌کند* و کلِ صفحه سفید
 * می‌شود. و دقیقاً همین حالت پیش می‌آید: به‌روزرسانیِ OTA فقط JS را عوض
 * می‌کند، نه باینری را. پس کاربری که روی نسخه‌ی نصب‌شده‌ی قبلی مانده و فقط
 * OTA گرفته، ماژولِ نیتیو را ندارد.
 *
 * راه‌حل: `requireOptionalNativeModule` که به‌جای پرتاب، null می‌دهد؛ و
 * `require`ِ تنبل داخلِ تابع تا بسته‌ی JS فقط وقتی اجرا شود که واقعاً
 * پشتیبانی هست. روی وب پیاده‌سازیِ JS جدا دارد (navigator.clipboard) و
 * ماژولِ نیتیو لازم ندارد.
 */
export const clipboardAvailable: boolean =
  Platform.OS === 'web' || requireOptionalNativeModule('ExpoClipboard') !== null;

/** متن را رونوشت می‌کند. false یعنی این نسخه رونوشت ندارد — فراخوان باید
 *  راهِ دیگری (برگه‌ی اشتراک‌گذاری) پیشنهاد کند. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!clipboardAvailable) return false;
  try {
    // require تنبل: import ایستا روی باینریِ قدیمی همین‌جا پرتاب می‌کرد.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Clipboard = require('expo-clipboard') as typeof import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    // ماژول هست ولی صدا زدنش شکست خورد — همان فالبک، بی‌سروصدا.
    return false;
  }
}
