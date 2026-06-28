import type { RandomMatch, RandomFilters } from '@/domain/entities';

export interface RandomRepository {
  join(filters?: RandomFilters): Promise<RandomMatch>;
  leave(): Promise<void>;
  status(): Promise<{ status: string }>;
}
