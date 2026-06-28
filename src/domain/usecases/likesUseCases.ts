import type { LikesRepository } from '@/domain/repositories/LikesRepository';

export const makeGetLikes = (r: LikesRepository) => () => r.getOverview();

export type LikesUseCases = { getLikes: ReturnType<typeof makeGetLikes> };
