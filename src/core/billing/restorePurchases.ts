import { bazaarBilling } from '@/core/billing/bazaarBilling';
import { isBazaarBuild } from '@/core/billing/paymentStrategy';

/**
 * جاروی بازیابیِ خریدهای گم‌شده.
 *
 * مسئله: `PaymentActivity`ِ poolakey وضعیتش را در فیلدهای static نگه می‌دارد. اگر
 * اندروید پروسه‌ی اپ را وسطِ پرداخت بکشد (روی دستگاه‌های ضعیف و مخصوصاً وقتی کاربر
 * برای شارژِ کیفِ پول از بازار بیرون می‌رود عادی است)، آن activity در پروسه‌ی تازه
 * بازسازی می‌شود و staticها خالی‌اند؛ promiseِ خرید هرگز settle نمی‌شود. پول کم شده،
 * خرید در بازار ثبت شده، و `/payments/bazaar/verify` هیچ‌وقت صدا زده نشده.
 *
 * راهِ حل: چون فقط بعد از ثبتِ موفق در سرور خرید را consume می‌کنیم، «مالکِ آن هست
 * ولی مصرف نشده» دقیقاً یعنی «پول داده ولی اعتبار نگرفته». پس خودِ بازار صفِ پایدارِ
 * ماست — در برابرِ مرگِ پروسه، نصبِ دوباره و تعویضِ دستگاه مقاوم.
 *
 * consume کردن فایده‌ی دومی هم دارد: SKU را دوباره قابلِ خرید می‌کند، وگرنه تمدیدِ
 * ماهِ بعد به ITEM_ALREADY_OWNED می‌خورد.
 */

export interface RestoreDeps {
  /** رسید را به سرور می‌دهد؛ سرور با Developer API اعتبارسنجی می‌کند. */
  restore: (purchaseToken: string, productId: string) => Promise<{ already: boolean }>;
}

export interface RestoreSummary {
  /** چند خرید تازه به کاربر اعتبار داد. */
  restored: number;
  /** چند تا از قبل ثبت شده بودند (فقط consume شدند). */
  already: number;
  /** چند تا این دور نشد — دفعه‌ی بعد دوباره تلاش می‌شود. */
  failed: number;
}

const EMPTY: RestoreSummary = { restored: 0, already: 0, failed: 0 };

// اجرای هم‌زمانِ دوباره بی‌فایده است و فقط به سرور فشار می‌آورد.
let running: Promise<RestoreSummary> | null = null;

/**
 * یک‌بار صفِ خریدهای مصرف‌نشده را خالی می‌کند. هرگز throw نمی‌کند — بازیابی یک کارِ
 * پس‌زمینه‌ی بهترین‌تلاش است و نباید جریانِ اپ را بشکند.
 */
export function restorePurchases(deps: RestoreDeps): Promise<RestoreSummary> {
  if (!isBazaarBuild || !bazaarBilling.isAvailable) return Promise.resolve(EMPTY);
  if (running) return running;

  running = sweep(deps).finally(() => {
    running = null;
  });
  return running;
}

async function sweep(deps: RestoreDeps): Promise<RestoreSummary> {
  const summary: RestoreSummary = { restored: 0, already: 0, failed: 0 };
  try {
    await bazaarBilling.connect();
  } catch {
    return summary; // بازار نصب نیست یا سرویسِ پرداخت بالا نیامده — بی‌صدا رد شو.
  }

  let owned;
  try {
    owned = await bazaarBilling.getPurchases();
  } catch {
    return summary;
  }
  if (!owned.length) return summary;

  for (const p of owned) {
    // purchaseState غیرِ صفر یعنی مرجوع‌شده — نه اعتبارش بده، نه consume کن.
    if (p.purchaseState !== 0) continue;
    try {
      const r = await deps.restore(p.purchaseToken, p.productId);
      if (r.already) summary.already += 1;
      else summary.restored += 1;
      // فقط بعد از تأییدِ سرور. اگر این‌جا شکست بخورد، خرید در صف می‌ماند و دفعه‌ی
      // بعد دوباره فرستاده می‌شود — سرور idempotent است، پس اعتبارِ اضافه نمی‌دهد.
      try {
        await bazaarBilling.consume(p.purchaseToken);
      } catch {
        /* دورِ بعد */
      }
    } catch {
      summary.failed += 1; // شبکه/سرور — دستِ نخورده می‌ماند تا دورِ بعد.
    }
  }
  return summary;
}
