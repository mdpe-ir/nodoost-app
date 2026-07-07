import type { Tier } from '@/domain/entities';

export interface CatalogRepository {
  getTiers(): Promise<Tier[]>;
  startZarinpalPayment(plan: string): Promise<{ payUrl: string }>;
  /** اعتبارسنجیِ خریدِ درون‌برنامه‌ایِ کافه‌بازار سمتِ سرور و فعال‌سازیِ اشتراک. */
  verifyBazaarPurchase(
    productId: string,
    purchaseToken: string
  ): Promise<{ subscriptionUntil?: string }>;
}
