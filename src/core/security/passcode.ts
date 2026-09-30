import * as Crypto from 'expo-crypto';

/**
 * هشِ رمزِ قفل (عددی یا الگو) — فقط سمتِ کلاینت.
 *
 * رمزِ قفل یک «قفلِ محلی» است، نه احرازِ هویت: هرگز به سرور نمی‌رود و ریکاوری
 * ندارد. برای همین به‌جای الگوریتمهای سنگینِ پسورد، SHA-256 با نمکِ تصادفیِ
 * ۱۶ بایتی کافی است — کسی که گوشی را در دست دارد با نمک، هش و شاید چند ده
 * ترکیبِ حدس روبهروست، و ترجیحِ ما این است که در آن حالت از راهِ دیگری
 * (خروج از همه) باز شود، نه با مقاومسازیِ بیفایده.
 */

/** نمکِ تصادفی — برای هر بارِ «تنظیمِ رمز» تازه ساخته می‌شود. */
export const generateSalt = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

/** هشِ رمز با نمک — خروجی HEXِ ۶۴ نویسی. */
export const hashSecret = (secret: string, salt: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${secret}`, {
    encoding: Crypto.CryptoEncoding.HEX,
  });

/**
 * مقایسه‌ی زمانِ ثابت — روی گوشی تفاوتِ عملی ندارد، ولی عادتِ درستِ مقایسه‌ی
 * رمز است و هزینه‌ای ندارد؛ همان الگویی که بکاند برای توکنها دارد.
 */
export const secretsMatch = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/** الگو را به رشته‌ای هش‌پذیر تبدیل می‌کند — «۳-۱-۵» مثل ورودیِ کیپد. */
export const patternToSecret = (dots: readonly number[]): string => dots.join('-');

/** فقط رقم — ورودیِ کیپد قبل از هش اعتبارسنجی می‌شود. */
export const isNumericSecret = (secret: string): boolean => /^[0-9]+$/.test(secret);
