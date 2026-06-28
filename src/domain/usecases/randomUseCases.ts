import type { RandomRepository } from '@/domain/repositories/RandomRepository';
import type { RandomFilters } from '@/domain/entities';

export const makeJoinRandom = (r: RandomRepository) => (filters?: RandomFilters) =>
  r.join(filters);
export const makeLeaveRandom = (r: RandomRepository) => () => r.leave();

export type RandomUseCases = {
  join: ReturnType<typeof makeJoinRandom>;
  leave: ReturnType<typeof makeLeaveRandom>;
};
