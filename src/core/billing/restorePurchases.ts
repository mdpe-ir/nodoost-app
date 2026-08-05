import { bazaarBilling } from '@/core/billing/bazaarBilling';
import { isBazaarBuild } from '@/core/billing/paymentStrategy';

/**
 * جاروی بازیابیِ خریدهای گم‌شده.
 *
 * مسئله: `PaymentActivity`ِ poolakey وضعیتش را در فیلدهای static نگه می‌دارد. اگر
 * اندروید پروسه‌ی اپ را وسطِ پرداخت بکشد (روی دستگاه‌های ضعیف و مخصوصاً وقتی کاربر
 * برای شارژِ کیفِ پول از بازار بیرون می‌رود عادی است)، promiseِ خرید هرگز settle
 * نمی‌شود. پول کم شده، خرید در بازار ثبت شده، و `/payments/bazaar/verify` هیچ‌وقت
 * صدا زده نشده.
 *
 * راهِ حل: چون فقط بعد از ثبتِ موفق در سرور خرید را consume می‌کنیم، «مالکِ آن هست
 * ولی مصرف نشده» دقیقاً یعنی «پول داده ولی اعتبار نگرفته». پس خودِ بازار صفِ پایدارِ
 * ماست — در برابرِ مرگِ پروسه، نصبِ دوباره و تعویضِ دستگاه مقاوم.
 *
 * درسِ ۲۰۲۶-۰۸: نسخه‌ی قبلیِ این جارو هفته‌ها روی همه‌ی دستگاه‌ها بی‌صدا شکست
 * می‌خورد (باگِ wrapperِ poolakey — اتصالِ شکست‌خورده «موفق» دیده می‌شد و در کش
 * می‌ماند) و چون هر خطایی همین‌جا بلعیده می‌شد، هیچ‌کس نفهمید. برای همین حالا هر
 * اجرا — موفق یا نه — با beacon به سرور گزارش می‌شود؛ «جاروی ساکت» دیگر از
 * «جاروی سالم» غیرقابلِ تشخیص نیست.
 */

// type (نه interface) تا از نظرِ ساختاری با Record<string, unknown>ِ لایه‌ی repo
// سازگار باشد — interface به‌خاطرِ قابلیتِ augmentation امضای ایندکسِ ضمنی ندارد.
export type SweepReport = {
  connect_ok: boolean;
  owned: number;
  restored: number;
  already: number;
  failed: number;
  consumed: number;
  errors: string[];
  trigger: string;
  duration_ms: number;
};

export interface RestoreDeps {
  /** رسید را به سرور می‌دهد؛ سرور با Developer API اعتبارسنجی می‌کند. */
  restore: (purchaseToken: string, productId: string) => Promise<{ already: boolean }>;
  /** beaconِ تشخیصی — بهترین‌تلاش؛ شکستش نباید جارو را بشکند. */
  report?: (r: SweepReport) => Promise<unknown>;
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

/** پیامِ خطا را کوتاه و رشته‌ای می‌کند — beacon است، نه استریمِ لاگ. */
function errStr(stage: string, e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e ?? 'unknown');
  return `${stage}: ${msg}`.slice(0, 300);
}

// اجرای هم‌زمانِ دوباره بی‌فایده است و فقط به سرور فشار می‌آورد.
let running: Promise<RestoreSummary> | null = null;

/**
 * یک‌بار صفِ خریدهای مصرف‌نشده را خالی می‌کند. هرگز throw نمی‌کند — بازیابی یک کارِ
 * پس‌زمینه‌ی بهترین‌تلاش است و نباید جریانِ اپ را بشکند.
 */
export function restorePurchases(deps: RestoreDeps, trigger = 'launch'): Promise<RestoreSummary> {
  if (!isBazaarBuild || !bazaarBilling.isAvailable) return Promise.resolve(EMPTY);
  if (running) return running;

  running = sweep(deps, trigger).finally(() => {
    running = null;
  });
  return running;
}

async function sweep(deps: RestoreDeps, trigger: string): Promise<RestoreSummary> {
  const startedAt = Date.now();
  const summary: RestoreSummary = { restored: 0, already: 0, failed: 0 };
  const errors: string[] = [];
  let connectOK = false;
  let owned: { productId: string; purchaseToken: string; purchaseState: number }[] = [];
  let consumed = 0;

  const finish = async (): Promise<RestoreSummary> => {
    // beacon همیشه فرستاده می‌شود، حتی برای جاروی خالی — سرور خودش تصمیم می‌گیرد
    // چه چیزی ارزشِ ماندن دارد. شکستِ beacon هم بی‌صداست؛ جارو کارش را کرده.
    try {
      await deps.report?.({
        connect_ok: connectOK,
        owned: owned.length,
        restored: summary.restored,
        already: summary.already,
        failed: summary.failed,
        consumed,
        errors,
        trigger,
        duration_ms: Date.now() - startedAt,
      });
    } catch {
      /* بی‌صدا */
    }
    return summary;
  };

  try {
    await bazaarBilling.connect();
    connectOK = true;
  } catch (e) {
    // بازار نصب نیست یا سرویسِ پرداخت بالا نیامده — جارو کاری نمی‌تواند بکند،
    // ولی برخلافِ گذشته این شکست دیگر نامرئی نیست.
    errors.push(errStr('connect', e));
    return finish();
  }

  try {
    owned = await bazaarBilling.getPurchases();
  } catch (e) {
    // اتصالِ به‌ظاهر وصل ولی مرده؟ یک‌بار با اتصالِ تازه دوباره تلاش کن.
    try {
      await bazaarBilling.forceReconnect();
      owned = await bazaarBilling.getPurchases();
    } catch (e2) {
      errors.push(errStr('getPurchases', e), errStr('getPurchases-retry', e2));
      return finish();
    }
  }
  if (!owned.length) return finish();

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
        consumed += 1;
      } catch (e) {
        errors.push(errStr(`consume ${p.productId}`, e)); // دورِ بعد
      }
    } catch (e) {
      summary.failed += 1; // شبکه/سرور — دستِ نخورده می‌ماند تا دورِ بعد.
      errors.push(errStr(`restore ${p.productId}`, e));
    }
  }
  return finish();
}
