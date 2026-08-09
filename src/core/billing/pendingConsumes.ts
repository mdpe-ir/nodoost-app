import { Platform } from 'react-native';

import { bazaarBilling } from '@/core/billing/bazaarBilling';
import { createLocalQueue, type QueueEntry } from '@/core/billing/localQueue';

/**
 * صفِ توکن‌هایی که سرور ثبتشان کرده ولی بازار هنوز «مصرف‌شده» نمی‌داندشان.
 *
 * چرا حیاتی است (و نه یک پاک‌سازیِ تزئینی): در کافه‌بازار تا وقتی یک خرید consume
 * نشده، همان SKU «مالِ کاربر» می‌ماند و خریدِ بعدیِ همان SKU با ITEM_ALREADY_OWNED
 * رد می‌شود. یعنی **تمدیدِ ماهِ بعد غیرممکن می‌شود**. لاگِ تولید (۲۰۲۶-۰۸-۰۵ تا ۰۸)
 * ۱۰ شکستِ consume از ۱۰ گزارش را نشان داد و اولین موجِ تمدید ۲۰۲۶-۰۸-۱۳ بود.
 *
 * چرا صف، نه صدا زدنِ مستقیم: هر ۱۰ شکست دقیقاً در همان ثانیه‌ی برگشت از صفحه‌ی
 * پرداختِ بازار رخ داده بود (`duration_ms: 0`) — یعنی وقتی اتصالِ سرویسِ بازار
 * تازه از سر گرفته شده و هنوز سالم نیست. صف همان کار را به لحظه‌ای موکول می‌کند
 * که اپ آرام در پیش‌زمینه است، و تا موفق نشدن هر بار دوباره تلاش می‌کند.
 *
 * عمداً به `getPurchasedProducts` وابسته نیست: آن فراخوانی روی دستگاهِ کاربرانِ
 * واقعی هیچ‌وقت جواب نمی‌دهد (۱۰۸۰ شکست از ۱۰۸۰). منبعِ این صف خودِ ماییم.
 */

export interface PendingConsume extends QueueEntry {
  purchaseToken: string;
  /** فقط برای گزارش و برای پیدا کردنِ توکنِ یک SKU هنگامِ ITEM_ALREADY_OWNED. */
  productId: string;
}

export interface ConsumeSummary {
  consumed: number;
  /** هنوز مانده — دورِ بعد دوباره تلاش می‌شود. */
  kept: number;
  errors: string[];
}

const EMPTY: ConsumeSummary = { consumed: 0, kept: 0, errors: [] };

/** بیش از این تعداد خریدِ مصرف‌نشده واقعی نیست. */
const MAX_ENTRIES = 20;
/**
 * بعد از این مدت دیگر تلاش نمی‌کنیم. سخاوتمندانه گرفته شده چون تنها ضررِ ماندنِ
 * یک ردیف، چند فراخوانیِ بی‌اثر است — ولی ضررِ زودحذف‌کردنش، مسدودشدنِ تمدید.
 */
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000; // ۱۸۰ روز

const native = Platform.OS !== 'web';

const queue = createLocalQueue<PendingConsume>({
  fileName: 'bazaar-consume-v1.json',
  keyOf: (e) => e.purchaseToken,
  isValid: (e) => typeof (e as PendingConsume).purchaseToken === 'string',
  maxEntries: MAX_ENTRIES,
  maxAgeMS: MAX_AGE_MS,
});

let running: Promise<ConsumeSummary> | null = null;

/**
 * توکن را برای مصرفِ بعدی ثبت می‌کند. فقط *بعد از* پذیرشِ سرور صدا زده شود —
 * مصرفِ خریدی که هنوز ثبت نشده یعنی پاک‌کردنِ تنها ردِ باقی‌مانده از پرداخت.
 */
export function queueConsume(purchaseToken: string, productId = ''): void {
  if (!native || !purchaseToken) return;
  queue.add({ purchaseToken, productId, savedAt: Date.now(), attempts: 0 });
}

/** آیا خریدِ مصرف‌نشده‌ای از این SKU می‌شناسیم؟ (پاسخِ ITEM_ALREADY_OWNED) */
export function pendingConsumeFor(productId: string): PendingConsume | undefined {
  if (!native || !productId) return undefined;
  return queue.read().find((e) => e.productId === productId);
}

export function pendingConsumeCount(): number {
  return queue.count();
}

/**
 * یک‌بار صف را خالی می‌کند. هرگز throw نمی‌کند.
 *
 * شکست همیشه گذراست (اتصالِ مرده، بازارِ بسته)، پس هیچ ردیفی به‌خاطرِ خطا دور
 * ریخته نمی‌شود — فقط با کهنه‌شدن می‌افتد. `attempts` بالا رفتن یعنی این دستگاه
 * واقعاً نمی‌تواند consume کند و همان چیزی است که در beacon دنبالش می‌گردیم.
 */
export function flushPendingConsumes(): Promise<ConsumeSummary> {
  if (!native || !bazaarBilling.isAvailable) return Promise.resolve(EMPTY);
  if (running) return running;
  running = drain().finally(() => {
    running = null;
  });
  return running;
}

async function drain(): Promise<ConsumeSummary> {
  const list = queue.read();
  if (!list.length) return EMPTY;

  const summary: ConsumeSummary = { consumed: 0, kept: 0, errors: [] };
  const keep: PendingConsume[] = [];

  try {
    await bazaarBilling.connect();
  } catch (e) {
    // بازار نصب نیست یا سرویسش بالا نیامده — همه می‌مانند برای دورِ بعد.
    summary.kept = list.length;
    summary.errors.push(errStr('connect', e));
    return summary;
  }

  for (const entry of list) {
    try {
      await bazaarBilling.consume(entry.purchaseToken);
      summary.consumed += 1;
    } catch (e) {
      summary.kept += 1;
      keep.push({ ...entry, attempts: entry.attempts + 1 });
      if (summary.errors.length < 5) {
        summary.errors.push(errStr(`consume ${entry.productId || '?'}`, e));
      }
    }
  }

  queue.write(keep);
  return summary;
}

/** پیامِ خطا را کوتاه و رشته‌ای می‌کند — beacon است، نه استریمِ لاگ. */
function errStr(stage: string, e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e ?? 'unknown');
  return `${stage}: ${msg}`.slice(0, 300);
}
