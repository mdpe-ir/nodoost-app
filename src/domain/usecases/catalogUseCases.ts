import type { CatalogRepository } from '@/domain/repositories/CatalogRepository';

export const makeGetTiers = (r: CatalogRepository) => () => r.getTiers();
export const makeStartPayment = (r: CatalogRepository) => (plan: string) =>
  r.startZarinpalPayment(plan);

export type CatalogUseCases = {
  getTiers: ReturnType<typeof makeGetTiers>;
  startPayment: ReturnType<typeof makeStartPayment>;
};
