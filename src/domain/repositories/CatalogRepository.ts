import type { Tier } from '@/domain/entities';

export interface CatalogRepository {
  getTiers(): Promise<Tier[]>;
  startZarinpalPayment(plan: string): Promise<{ payUrl: string }>;
}
