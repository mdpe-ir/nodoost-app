import type { PurchaseResult, Tier } from '@/domain/entities';

export interface CatalogRepository {
  getTiers(): Promise<Tier[]>;
  startZarinpalPayment(plan: string): Promise<{ payUrl: string }>;
  /**
   * اعتبارسنجیِ خریدِ درون‌برنامه‌ایِ کافه‌بازار سمتِ سرور (با امضای RSA) و فعال‌سازیِ اشتراک.
   * `originalJson` دادهٔ امضاشدهٔ خرید و `dataSignature` امضای آن است.
   *
   * پاسخ می‌گوید خرید ارتقا بوده، تمدید، یا در صف نشسته — همان چیزی که پیامِ
   * بعد از خرید باید از رویش نوشته شود.
   */
  verifyBazaarPurchase(originalJson: string, dataSignature: string): Promise<PurchaseResult>;
  /** beaconِ تشخیصیِ جاروی بازیابی — سرور شکست‌های بی‌صدا را این‌طور می‌بیند. */
  reportBazaarSweep(report: Record<string, unknown>): Promise<void>;
  /**
   * بازیابیِ خریدی که در بازار انجام شده ولی رسیدش هرگز به سرور نرسیده — مثلاً
   * وقتی اندروید پروسه‌ی اپ را وسطِ پرداخت کشته و promiseِ خرید هرگز settle نشده.
   *
   * برخلافِ verify این‌جا امضا در دست نیست (بازار در فهرستِ خریدهای مصرف‌نشده امضا
   * نمی‌دهد)، پس سرور با Developer API اعتبارسنجی می‌کند. idempotent است.
   */
  restoreBazaarPurchase(purchaseToken: string, productId: string): Promise<PurchaseResult>;
}
