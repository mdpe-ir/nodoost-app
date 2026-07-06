import type { LikesRepository } from '@/domain/repositories/LikesRepository';

export const makeGetLikes = (r: LikesRepository) => () => r.getOverview();
export const makeGetSentLikes = (r: LikesRepository) => () => r.getSent();

export type LikesUseCases = {
  getLikes: ReturnType<typeof makeGetLikes>;
  getSentLikes: ReturnType<typeof makeGetSentLikes>;
};
