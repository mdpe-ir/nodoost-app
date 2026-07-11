import type { LikesRepository } from '@/domain/repositories/LikesRepository';

export const makeGetLikes = (r: LikesRepository) => () => r.getOverview();
export const makeGetSentLikes = (r: LikesRepository) => () => r.getSent();
export const makeGetViewers = (r: LikesRepository) => () => r.getViewers();

export type LikesUseCases = {
  getLikes: ReturnType<typeof makeGetLikes>;
  getSentLikes: ReturnType<typeof makeGetSentLikes>;
  getViewers: ReturnType<typeof makeGetViewers>;
};
