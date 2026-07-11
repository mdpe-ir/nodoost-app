import type { CatalogRepository } from '@/domain/repositories/CatalogRepository';
import type { Tier } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { TierDTO } from '@/data/dto';
import { toTier } from '@/data/mappers';

export class CatalogRepositoryImpl implements CatalogRepository {
  constructor(private readonly http: HttpClient) {}

  async getTiers(): Promise<Tier[]> {
    const d = await this.http.request<{ tiers: TierDTO[] }>('/api/tiers');
    return (d?.tiers ?? []).map(toTier);
  }

  async startZarinpalPayment(plan: string): Promise<{ payUrl: string }> {
    const d = await this.http.request<{ pay_url: string }>('/api/payments/zarinpal/request', {
      method: 'POST',
      body: { plan },
    });
    return { payUrl: d.pay_url };
  }

  async verifyBazaarPurchase(
    originalJson: string,
    dataSignature: string
  ): Promise<{ subscriptionUntil?: string }> {
    const d = await this.http.request<{ subscription_until?: string }>(
      '/api/payments/bazaar/verify',
      {
        method: 'POST',
        body: { original_json: originalJson, data_signature: dataSignature },
      }
    );
    return { subscriptionUntil: d?.subscription_until };
  }
}
