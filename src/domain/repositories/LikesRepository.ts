import type { LikesOverview } from '@/domain/entities';

export interface LikesRepository {
  getOverview(): Promise<LikesOverview>;
}
