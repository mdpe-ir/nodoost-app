import type { LikesRepository } from '@/domain/repositories/LikesRepository';

export const makeGetLikes = (r: LikesRepository) => (page?: number) => r.getOverview(page);
export const makeGetSentLikes = (r: LikesRepository) => (page?: number) => r.getSent(page);
export const makeGetViewers = (r: LikesRepository) => () => r.getViewers();

export type LikesUseCases = {
  getLikes: ReturnType<typeof makeGetLikes>;
  getSentLikes: ReturnType<typeof makeGetSentLikes>;
  getViewers: ReturnType<typeof makeGetViewers>;
};
