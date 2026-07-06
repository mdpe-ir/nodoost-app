import type { Liker, LikesOverview } from '@/domain/entities';

export interface LikesRepository {
  getOverview(): Promise<LikesOverview>;
  /** کسانی که من پسندیده‌ام — همیشه آشکار. */
  getSent(): Promise<Liker[]>;
}
