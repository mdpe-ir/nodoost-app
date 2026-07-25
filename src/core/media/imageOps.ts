import { Image } from 'react-native';
import {
  ImageManipulator,
  SaveFormat,
  manipulateAsync,
  type Action,
  type ImageRef,
} from 'expo-image-manipulator';

/**
 * لایه‌ی نازکِ روی expo-image-manipulator — تنها جایی که با آن حرف می‌زند.
 *
 * دو کار می‌کند که بقیه‌ی اپ به آن تکیه دارد:
 * ۱) ابعادِ *واقعیِ* عکس را از خودِ دیکدر می‌گیرد (نه از فراداده‌ی پیکر)، تا چرخشِ
 *    EXIF از قبل اعمال شده باشد و ریاضیِ برش با آن‌چه کاربر می‌بیند یکی باشد.
 * ۲) خروجی همیشه JPEG است؛ بک‌اند فقط JPEG/PNG را دیکد می‌کند و کلاینت هم فایل را
 *    با برچسبِ image/jpeg می‌فرستد. هر خروجیِ دیگری یعنی «not a valid image».
 */

/** مستطیلِ برش در مختصاتِ پیکسلیِ عکسِ اصلی (نه مختصاتِ صفحه). */
export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
}

export interface ProcessOptions {
  /** برشِ اختیاری — پیش از تغییرِ اندازه اعمال می‌شود. */
  crop?: CropRect;
  /** بزرگ‌ترین ضلعِ خروجی؛ عکسِ کوچک‌تر هرگز بزرگ‌نمایی نمی‌شود. */
  maxSize?: number;
  /** ۰ تا ۱ — هرچه کمتر، فشرده‌تر. */
  compress?: number;
}

const DEFAULT_MAX_SIZE = 1440;
const DEFAULT_COMPRESS = 0.82;

/** ابعادِ عکس بدونِ دست‌زدن به بایت‌ها — برای حالتی که منبع از پیش پردازش نشده است. */
export function measureImage(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (e) => reject(e instanceof Error ? e : new Error('اندازه‌ی عکس خوانده نشد'))
    );
  });
}

/** مستطیلِ برش را داخلِ مرزهای عکس نگه می‌دارد و به عددِ صحیح گرد می‌کند. */
function clampRect(rect: CropRect, srcW: number, srcH: number): CropRect {
  const width = Math.max(1, Math.min(Math.round(rect.width), srcW));
  const height = Math.max(1, Math.min(Math.round(rect.height), srcH));
  return {
    width,
    height,
    originX: Math.max(0, Math.min(Math.round(rect.originX), srcW - width)),
    originY: Math.max(0, Math.min(Math.round(rect.originY), srcH - height)),
  };
}

/** آیا APIِ شیءگرای جدید (SDK ۵۲+) در دسترس است؟ */
function hasModernApi(): boolean {
  const m = ImageManipulator as unknown as { manipulate?: unknown } | undefined;
  return typeof m?.manipulate === 'function';
}

/** برش/تغییرِ اندازه/فشرده‌سازی — خروجی همیشه JPEG. */
export async function processImage(
  source: string,
  opts: ProcessOptions = {}
): Promise<ProcessedImage> {
  const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
  const compress = opts.compress ?? DEFAULT_COMPRESS;
  return hasModernApi()
    ? modernProcess(source, opts.crop, maxSize, compress)
    : legacyProcess(source, opts.crop, maxSize, compress);
}

async function modernProcess(
  source: string,
  crop: CropRect | undefined,
  maxSize: number,
  compress: number
): Promise<ProcessedImage> {
  // رندرِ اول فقط برای خواندنِ ابعادِ واقعی است؛ این‌جا EXIF از قبل اعمال شده است.
  const ref: ImageRef = await ImageManipulator.manipulate(source).renderAsync();
  let ctx = ImageManipulator.manipulate(ref);
  let w = ref.width;
  let h = ref.height;

  if (crop) {
    const r = clampRect(crop, w, h);
    ctx = ctx.crop(r);
    w = r.width;
    h = r.height;
  }
  if (Math.max(w, h) > maxSize) {
    ctx = w >= h ? ctx.resize({ width: maxSize }) : ctx.resize({ height: maxSize });
  }

  const out = await (await ctx.renderAsync()).saveAsync({ compress, format: SaveFormat.JPEG });
  return { uri: out.uri, width: out.width, height: out.height };
}

/** مسیرِ پشتیبان برای نسخه‌های قدیمی‌ترِ ماژول (و وب) — همان نتیجه، با APIِ منسوخ. */
async function legacyProcess(
  source: string,
  crop: CropRect | undefined,
  maxSize: number,
  compress: number
): Promise<ProcessedImage> {
  const { width: srcW, height: srcH } = await measureImage(source);
  const actions: Action[] = [];
  let w = srcW;
  let h = srcH;

  if (crop) {
    const r = clampRect(crop, w, h);
    actions.push({ crop: r });
    w = r.width;
    h = r.height;
  }
  if (Math.max(w, h) > maxSize) {
    actions.push(w >= h ? { resize: { width: maxSize } } : { resize: { height: maxSize } });
  }

  const out = await manipulateAsync(source, actions, { compress, format: SaveFormat.JPEG });
  return { uri: out.uri, width: out.width, height: out.height };
}
