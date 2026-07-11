import type { Tier } from '@/domain/entities';

export interface CatalogRepository {
  getTiers(): Promise<Tier[]>;
  startZarinpalPayment(plan: string): Promise<{ payUrl: string }>;
  /**
   * اعتبارسنجیِ خریدِ درون‌برنامه‌ایِ کافه‌بازار سمتِ سرور (با امضای RSA) و فعال‌سازیِ اشتراک.
   * `originalJson` دادهٔ امضاشدهٔ خرید و `dataSignature` امضای آن است.
   */
  verifyBazaarPurchase(
    originalJson: string,
    dataSignature: string
  ): Promise<{ subscriptionUntil?: string }>;
}
