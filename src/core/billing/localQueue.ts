import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

/**
 * صفِ کوچکِ ماندگار روی دیسک — پایه‌ی مشترکِ صف‌های بازیابیِ پرداخت.
 *
 * چرا روی دیسک و نه در حافظه: هر چیزی که فقط در حافظه باشد با کشته‌شدنِ پروسه‌ی
 * اپ می‌رود، و «مرگِ پروسه وسطِ پرداخت» دقیقاً همان حالتی است که این صف‌ها برای
 * آن ساخته شده‌اند.
 *
 * چرا مشترک: دو صف داریم (رسیدهای تأییدنشده و توکن‌های مصرف‌نشده) با چرخه‌ی عمرِ
 * متفاوت ولی نیازِ ذخیره‌سازیِ یکسان. کپیِ دومِ همین سی خط، جایی است که باگ‌های
 * نامتقارن زاده می‌شوند.
 *
 * قواعدِ ثابت: هرگز throw نمی‌کند (بازیابی بهترین‌تلاش است و نباید جریانِ خرید را
 * بشکند)، روی وب بی‌اثر است، و ردیف‌های کهنه/خراب را خودش دور می‌ریزد.
 */

export interface QueueEntry {
  /** میلی‌ثانیه؛ برای پیرسنجی. */
  savedAt: number;
  /** چند بار تلاشِ ناموفق داشته — فقط برای تشخیص، نه برای تصمیم. */
  attempts: number;
}

export interface LocalQueue<T extends QueueEntry> {
  read(): T[];
  write(list: T[]): void;
  /** اگر کلید تکراری باشد چیزی اضافه نمی‌شود. */
  add(entry: T): void;
  remove(key: string): void;
  count(): number;
}

export interface QueueOptions<T extends QueueEntry> {
  /** نامِ فایل در پوشه‌ی document — نسخه را داخلِ نام بگذارید. */
  fileName: string;
  /** کلیدِ یکتای هر ردیف. */
  keyOf: (entry: T) => string;
  /** ردیف‌های ناقص را رد می‌کند (فایلِ نسخه‌ی قبلی یا دست‌کاری‌شده). */
  isValid: (entry: unknown) => boolean;
  /** سقفِ تعداد؛ قدیمی‌ترین‌ها می‌افتند. */
  maxEntries: number;
  /** سنِ بیشینه به میلی‌ثانیه. */
  maxAgeMS: number;
}

const native = Platform.OS !== 'web';

export function createLocalQueue<T extends QueueEntry>(opts: QueueOptions<T>): LocalQueue<T> {
  const file = () => new File(Paths.document, opts.fileName);

  const read = (): T[] => {
    if (!native) return [];
    try {
      const f = file();
      if (!f.exists) return [];
      const raw = JSON.parse(f.textSync()) as unknown;
      if (!Array.isArray(raw)) return [];
      const now = Date.now();
      return raw.filter(
        (e): e is T =>
          !!e &&
          typeof e === 'object' &&
          opts.isValid(e) &&
          now - ((e as QueueEntry).savedAt ?? 0) < opts.maxAgeMS
      );
    } catch {
      return []; // فایلِ خراب نباید جریانِ خرید را بشکند.
    }
  };

  const write = (list: T[]): void => {
    if (!native) return;
    try {
      const f = file();
      if (!f.exists) f.create({ intermediates: true });
      f.write(JSON.stringify(list.slice(-opts.maxEntries)));
    } catch {
      /* دیسکِ پر یا مجوز — بازیابی «بهترین‌تلاش» است، نه تضمین. */
    }
  };

  return {
    read,
    write,
    add(entry) {
      if (!native) return;
      const list = read();
      const key = opts.keyOf(entry);
      if (list.some((e) => opts.keyOf(e) === key)) return;
      list.push(entry);
      write(list);
    },
    remove(key) {
      if (!native) return;
      const list = read();
      const next = list.filter((e) => opts.keyOf(e) !== key);
      if (next.length !== list.length) write(next);
    },
    count: () => read().length,
  };
}
