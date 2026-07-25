import { processImage, type ProcessOptions, type ProcessedImage } from './imageOps';

/**
 * هر عکسِ انتخاب‌شده را به JPEGِ فشرده و کوچک‌شده تبدیل می‌کند.
 *
 * چرا لازم است: پیکرِ اندروید اغلب فایلِ گالری را همان‌طور که هست برمی‌گرداند —
 * WebP یا HEIC و گاهی چندده‌مگابایتی. اما بک‌اند فقط JPEG/PNGِ تا ۸ مگابایت را
 * دیکد می‌کند و کلاینت هم فایل را همیشه با برچسبِ image/jpeg می‌فرستد؛ نتیجه:
 * «not a valid image / invalid upload» و در UI «ثبت ناموفق بود».
 *
 * نسخه‌ی قبلی هر خطایی را می‌بلعید و uriِ اصلی را برمی‌گرداند — یعنی دقیقاً همان
 * فایلِ HEIC/WebP آپلود می‌شد و سرور ردش می‌کرد. حالا اگر تبدیل شکست بخورد،
 * خطای تایپ‌دارِ ImageProcessError پرتاب می‌شود تا کاربر پیامِ درست ببیند و
 * فایلِ غیرقابلِ‌دیکد اصلاً روی شبکه نرود.
 */

/** بزرگ‌ترین ضلعِ عکسی که آپلود می‌شود. */
export const MAX_UPLOAD_SIZE = 1440;

/** شکستِ پردازشِ محلیِ عکس — پیامش مستقیماً به کاربر نشان داده می‌شود. */
export class ImageProcessError extends Error {
  constructor(
    message = 'این عکس روی دستگاهِ تو قابلِ پردازش نیست. عکسِ دیگری انتخاب کن یا با دوربین یکی بگیر.'
  ) {
    super(message);
    this.name = 'ImageProcessError';
  }
}

/** برش/تغییرِ اندازه با ضمانتِ خروجیِ JPEG؛ در صورتِ شکست ImageProcessError. */
export async function toJpeg(uri: string, opts: ProcessOptions = {}): Promise<ProcessedImage> {
  try {
    return await processImage(uri, { maxSize: MAX_UPLOAD_SIZE, compress: 0.82, ...opts });
  } catch {
    throw new ImageProcessError();
  }
}

/** همان toJpeg بدونِ برش — فقط uriِ خروجی. */
export async function normalizeImage(uri: string): Promise<string> {
  return (await toJpeg(uri)).uri;
}
