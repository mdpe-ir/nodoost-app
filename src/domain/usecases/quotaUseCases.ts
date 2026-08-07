import type { QuotaRepository } from '@/domain/repositories/QuotaRepository';

export const makeGetQuota = (r: QuotaRepository) => () => r.get();

export type QuotaUseCases = {
  get: ReturnType<typeof makeGetQuota>;
};
