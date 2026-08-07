import type { QuotaRepository } from '@/domain/repositories/QuotaRepository';
import type { Quota, QuotaItem, QuotaKey, QuotaScope } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';

interface QuotaItemDTO {
  key: string;
  scope: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  unlock_tier?: number;
  unlock_limit?: number;
  unlock_unlimited?: boolean;
}

interface QuotaDTO {
  tier: number;
  is_plus: boolean;
  subscription_until?: string | null;
  days_left: number;
  resets_at?: string | null;
  items: QuotaItemDTO[];
}

const KNOWN: QuotaKey[] = ['conversation', 'random', 'like'];

const toItem = (d: QuotaItemDTO): QuotaItem => ({
  key: d.key as QuotaKey,
  scope: (d.scope === 'lifetime' ? 'lifetime' : 'daily') as QuotaScope,
  used: d.used ?? 0,
  limit: d.limit ?? null,
  remaining: d.remaining ?? null,
  unlimited: Boolean(d.unlimited ?? d.limit == null),
  unlockTier: d.unlock_tier,
  unlockLimit: d.unlock_limit,
  unlockUnlimited: d.unlock_unlimited,
});

export class QuotaRepositoryImpl implements QuotaRepository {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<Quota> {
    const d = await this.http.request<QuotaDTO>('/api/me/quota');
    return {
      tier: d?.tier ?? 1,
      isPlus: Boolean(d?.is_plus),
      subscriptionUntil: d?.subscription_until ?? undefined,
      daysLeft: d?.days_left ?? 0,
      resetsAt: d?.resets_at ?? undefined,
      // کلیدِ ناشناخته (سرورِ جلوتر از اپ) دور ریخته می‌شود تا رابطِ کاربری
      // آیتمی را که نمی‌داند چطور بنویسد، نصفه‌نیمه نشان ندهد.
      items: (d?.items ?? []).filter((i) => KNOWN.includes(i.key as QuotaKey)).map(toItem),
    };
  }
}
