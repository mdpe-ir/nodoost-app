import { Linking } from 'react-native';

/**
 * بازکردنِ فرمِ «ثبتِ نظر»ِ کافه‌بازار برای همین اپ.
 *
 * کافه‌بازار API درون‌برنامه‌ای مثلِ ReviewManagerِ گوگل‌پلی ندارد؛ راهِ رسمی یک
 * Intent است:
 *
 *   Intent(ACTION_EDIT, "bazaar://details?id=<pkg>")
 *
 * نکته‌ی کلیدی: `ACTION_EDIT` صفحه‌ی *نوشتنِ نظر و ستاره* را باز می‌کند، ولی
 * `ACTION_VIEW` فقط صفحه‌ی اپ را. و `Linking.openURL` در React Native همیشه
 * ACTION_VIEW می‌فرستد — پس برای رسیدن به فرمِ نظر چاره‌ای جز IntentLauncher نیست.
 *
 * چرا `packageName` را به IntentLauncher نمی‌دهیم: پیاده‌سازیِ اندرویدیِ
 * expo-intent-launcher فقط وقتی `className` هم بدهی از packageName استفاده می‌کند
 * (برای ساختنِ ComponentName)؛ معادلِ `setPackage` تنها را ندارد. اما هیچ اپِ
 * دیگری اسکیمِ `bazaar://` را claim نمی‌کند، پس intentِ ضمنی هم به بازار می‌رسد.
 * دیده‌شدنِ پکیجِ بازار در اندروید ۱۱+ را بلاکِ <queries> در
 * `plugins/withBazaarBilling.js` تضمین کرده است.
 *
 * expo-intent-launcher ماژولِ نیتیو است و با OTA به APKهای قدیمی نمی‌رسد؛ به همین
 * دلیل require داخلِ try/catch است تا روی نسخه‌های قدیمی، به‌جای کرش، به صفحه‌ی
 * عادیِ اپ در بازار برگردیم.
 */
const PKG = 'com.nodoost.app';
const DETAILS_URI = `bazaar://details?id=${PKG}`;
const ACTION_EDIT = 'android.intent.action.EDIT';

type IntentLauncherModule = {
  startActivityAsync: (action: string, params: { data?: string }) => Promise<unknown>;
};

function loadIntentLauncher(): IntentLauncherModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-intent-launcher') as IntentLauncherModule;
  } catch {
    return null;
  }
}

/**
 * نتیجه‌ی تلاش برای فرستادنِ کاربر به بازار:
 *  - `review` فرمِ ثبتِ نظر باز شد (چیزی که می‌خواستیم)
 *  - `details` فقط صفحه‌ی اپ باز شد (بازار هست ولی ACTION_EDIT نگرفت)
 *  - `web`     بازار نبود و آدرسِ وب باز شد
 *  - `failed`  هیچ‌کدام
 */
export type RateOutcome = 'review' | 'details' | 'web' | 'failed';

/**
 * زنجیره‌ی fallback: فرمِ نظر → صفحه‌ی اپ در بازار → صفحه‌ی وبِ بازار.
 *
 * هر سه پله شکست‌پذیرند و هیچ‌کدام خطا پرت نمی‌کنند؛ صدازننده فقط از خروجی
 * می‌فهمد چه‌قدر جلو رفتیم.
 */
export async function openBazaarReview(storeUrl?: string): Promise<RateOutcome> {
  const launcher = loadIntentLauncher();
  if (launcher) {
    try {
      await launcher.startActivityAsync(ACTION_EDIT, { data: DETAILS_URI });
      return 'review';
    } catch {
      /* بازار نصب نیست یا ACTION_EDIT را نمی‌شناسد — پله‌ی بعد */
    }
  }

  try {
    if (await Linking.canOpenURL(DETAILS_URI)) {
      await Linking.openURL(DETAILS_URI);
      return 'details';
    }
  } catch {
    /* پله‌ی بعد */
  }

  const web = storeUrl?.trim() || `https://cafebazaar.ir/app/${PKG}`;
  try {
    await Linking.openURL(web);
    return 'web';
  } catch {
    return 'failed';
  }
}
