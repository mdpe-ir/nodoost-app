import type { Quota } from '@/domain/entities';

export interface QuotaRepository {
  /** سهمیه‌ی لحظه‌ایِ کاربرِ جاری. */
  get(): Promise<Quota>;
}
