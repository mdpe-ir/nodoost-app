import * as ImageManipulator from 'expo-image-manipulator';

/**
 * هر عکسِ انتخاب‌شده را به JPEGِ فشرده و کوچک‌شده تبدیل می‌کند.
 *
 * چرا لازم است: پیکرِ اندروید اغلب فایلِ گالری را همان‌طور که هست برمی‌گرداند —
 * WebP یا HEIC و گاهی چندده‌مگابایتی. اما بک‌اند فقط JPEG/PNGِ تا ۸ مگابایت را
 * دیکد می‌کند و کلاینت هم فایل را همیشه با برچسبِ image/jpeg می‌فرستد؛ نتیجه:
 * «not a valid image / invalid upload» و در UI «ثبت ناموفق بود».
 * این‌جا بایت‌ها را واقعاً به JPEG تبدیل و اندازه را محدود می‌کنیم تا با برچسب و
 * با دیکدرِ سرور بخواند.
 *
 * اگر تبدیل به هر دلیل شکست بخورد، همان uri اصلی برمی‌گردد تا از قبل بدتر نشود.
 */
export async function normalizeImage(uri: string): Promise<string> {
  try {
    const M = ImageManipulator as unknown as {
      // API جدید (SDK ۵۲+)
      ImageManipulator?: {
        manipulate: (u: string) => {
          resize: (o: { width: number }) => {
            renderAsync: () => Promise<{
              saveAsync: (o: { compress: number; format: unknown }) => Promise<{ uri: string }>;
            }>;
          };
        };
      };
      // API قدیمی (منسوخ ولی هنوز رایج)
      manipulateAsync?: (
        u: string,
        actions: unknown[],
        opts: { compress: number; format: unknown }
      ) => Promise<{ uri: string }>;
      SaveFormat: { JPEG: unknown };
    };

    if (typeof M.ImageManipulator?.manipulate === 'function') {
      const ref = await M.ImageManipulator.manipulate(uri).resize({ width: 1440 }).renderAsync();
      const out = await ref.saveAsync({ compress: 0.8, format: M.SaveFormat.JPEG });
      return out.uri;
    }
    if (typeof M.manipulateAsync === 'function') {
      const out = await M.manipulateAsync(uri, [{ resize: { width: 1440 } }], {
        compress: 0.8,
        format: M.SaveFormat.JPEG,
      });
      return out.uri;
    }
  } catch {
    /* برمی‌گردیم به uri اصلی */
  }
  return uri;
}
