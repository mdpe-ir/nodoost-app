import type { CatalogRepository } from '@/domain/repositories/CatalogRepository';

export const makeGetTiers = (r: CatalogRepository) => () => r.getTiers();
export const makeStartPayment = (r: CatalogRepository) => (plan: string) =>
  r.startZarinpalPayment(plan);
export const makeVerifyBazaarPurchase =
  (r: CatalogRepository) => (originalJson: string, dataSignature: string) =>
    r.verifyBazaarPurchase(originalJson, dataSignature);

export type CatalogUseCases = {
  getTiers: ReturnType<typeof makeGetTiers>;
  startPayment: ReturnType<typeof makeStartPayment>;
  verifyBazaarPurchase: ReturnType<typeof makeVerifyBazaarPurchase>;
};
