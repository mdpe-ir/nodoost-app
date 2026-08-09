import { Platform } from 'react-native';

import { ApiError } from '@/core/http/ApiError';
import { createLocalQueue, type QueueEntry } from '@/core/billing/localQueue';
import { queueConsume } from '@/core/billing/pendingConsumes';
import type { PurchaseResult } from '@/domain/entities';

/**
 * صفِ محلیِ رسیدهای تأییدنشده.
 *
 * چرا لازم شد: طرحِ بازیابیِ قبلی فرض می‌کرد «صفِ خریدهای مصرف‌نشده» را می‌شود از
 * خودِ بازار خواند (`getPurchasedProducts`). لاگِ تولید (۱۳۵ کاربر، ۱۰۷۷ تلاش،
 * ۲۰۲۶-۰۸-۰۵ تا ۰۸) نشان داد آن فراخوانی روی دستگاهِ کاربرانِ واقعی هیچ‌وقت جواب
 * نمی‌دهد و `consume` هم رد می‌شود؛ یعنی آن صف در عمل ناخواندنی است.
 *
 * این صف به بازار وابسته نیست: به‌محضِ این‌که خرید در اپ resolve شد، خودِ payloadِ
 * امضاشده روی دیسک می‌نشیند و تا وقتی سرور آن را نپذیرفته هر بار اجرا/بازگشت به
 * پیش‌زمینه دوباره فرستاده می‌شود. سرور idempotent است، پس تکرار بی‌ضرر است.
 *
 * پوششِ این صف: قطعِ شبکه، خطای ۵xx، بسته‌شدنِ اپ بینِ خرید و تأیید. آن‌چه پوشش
 * نمی‌دهد، مرگِ پروسه *پیش از* resolve شدنِ خرید است — آن‌جا هیچ payloadی وجود
 * ندارد و تنها راه، درستشدنِ همان APIهای بازار یا جبرانِ دستیِ پشتیبانی است.
 */

export interface PendingReceipt extends QueueEntry {
  originalJson: string;
  dataSignature: string;
  /** فقط برای لاگ و پاک‌سازی؛ منبعِ حقیقت همان payloadِ امضاشده است. */
  productId: string;
  purchaseToken: string;
}

export interface FlushDeps {
  verify: (originalJson: string, dataSignature: string) => Promise<PurchaseResult>;
}

export interface FlushSummary {
  /** رسیدهایی که سرور تازه پذیرفت. */
  accepted: number;
  /** رسیدهایی که سرور رد کرد و برای همیشه کنار گذاشته شدند. */
  dropped: number;
  /** رسیدهایی که هنوز در صف مانده‌اند (شبکه/سرور). */
  kept: number;
}

const EMPTY: FlushSummary = { accepted: 0, dropped: 0, kept: 0 };

/** بیش از این تعداد رسیدِ معلق واقعی نیست؛ قدیمی‌ترین‌ها می‌افتند. */
const MAX_ENTRIES = 20;
/** رسیدی که این‌قدر کهنه شده، دیگر به درد بازیابیِ خودکار نمی‌خورد. */
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // ۶۰ روز

const native = Platform.OS !== 'web';

let running: Promise<FlushSummary> | null = null;

/** کلیدِ یکتای هر رسید؛ خودِ payloadِ امضاشده تغییرناپذیر است. */
const keyOf = (r: { originalJson: string }) => r.originalJson;

const queue = createLocalQueue<PendingReceipt>({
  fileName: 'bazaar-pending-v1.json',
  keyOf,
  isValid: (e) =>
    typeof (e as PendingReceipt).originalJson === 'string' &&
    typeof (e as PendingReceipt).dataSignature === 'string',
  maxEntries: MAX_ENTRIES,
  maxAgeMS: MAX_AGE_MS,
});

/**
 * رسید را پیش از فرستادن به سرور ثبت می‌کند. باید *قبل* از verify صدا زده شود:
 * اگر بینِ خرید و تأیید اپ کشته شود، همین ردیف تنها ردِ باقی‌مانده است.
 */
export function savePendingReceipt(r: {
  originalJson: string;
  dataSignature: string;
  productId?: string;
  purchaseToken?: string;
}): void {
  if (!native || !r.originalJson || !r.dataSignature) return;
  queue.add({
    originalJson: r.originalJson,
    dataSignature: r.dataSignature,
    productId: r.productId ?? '',
    purchaseToken: r.purchaseToken ?? '',
    savedAt: Date.now(),
    attempts: 0,
  });
}

/** رسیدِ ثبت‌شده در سرور را از صف بیرون می‌برد. */
export function clearPendingReceipt(originalJson: string): void {
  queue.remove(originalJson);
}

export function pendingReceiptCount(): number {
  return queue.count();
}

/**
 * صف را یک‌بار خالی می‌کند. هرگز throw نمی‌کند.
 *
 * پاسخِ سرور دو دسته است: «تصمیمِ نهایی» (۴xx — امضای نامعتبر، محصولِ ناشناخته،
 * رسیدِ کاربرِ دیگر) که رسید را برای همیشه دور می‌ریزد، و «هنوز نه» (شبکه، ۵xx،
 * ۴۰۱/۴۲۹) که آن را برای دورِ بعد نگه می‌دارد. بدونِ این تفکیک، یک رسیدِ باطل
 * تا ابد در هر بار باز شدنِ اپ به سرور کوبیده می‌شود.
 */
export function flushPendingReceipts(deps: FlushDeps): Promise<FlushSummary> {
  if (!native) return Promise.resolve(EMPTY);
  if (running) return running;
  running = drain(deps).finally(() => {
    running = null;
  });
  return running;
}

async function drain(deps: FlushDeps): Promise<FlushSummary> {
  const list = queue.read();
  if (!list.length) return EMPTY;

  const summary: FlushSummary = { accepted: 0, dropped: 0, kept: 0 };
  const keep: PendingReceipt[] = [];

  for (const entry of list) {
    try {
      await deps.verify(entry.originalJson, entry.dataSignature);
      summary.accepted += 1;
      // ثبت شد ⇒ حالا باید به بازار هم گفته شود. اینجا مستقیم consume نمی‌کنیم:
      // آن کار صفِ خودش را دارد که با اتصالِ سالم و با تکرار اجرا می‌شود.
      queueConsume(entry.purchaseToken, entry.productId);
    } catch (err) {
      if (isTerminal(err)) {
        summary.dropped += 1;
        continue;
      }
      summary.kept += 1;
      keep.push({ ...entry, attempts: entry.attempts + 1 });
    }
  }

  queue.write(keep);
  return summary;
}

/** آیا پاسخِ سرور تصمیمِ نهایی است (تلاشِ دوباره بی‌فایده)؟ */
function isTerminal(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false; // خطای شبکه ⇒ دوباره تلاش کن
  const { status } = err;
  if (status === 401 || status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
}
