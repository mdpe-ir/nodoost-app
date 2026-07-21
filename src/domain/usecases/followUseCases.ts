import type { FollowRepository } from '@/domain/repositories/FollowRepository';
import type { FollowListKind } from '@/domain/entities';

export const makeFollow = (r: FollowRepository) => (userId: number) => r.follow(userId);
export const makeUnfollow = (r: FollowRepository) => (userId: number) => r.unfollow(userId);
export const makeGetFollowList =
  (r: FollowRepository) => (kind: FollowListKind, userId?: number, page?: number) =>
    r.getList(kind, userId, page);

export type FollowUseCases = {
  follow: ReturnType<typeof makeFollow>;
  unfollow: ReturnType<typeof makeUnfollow>;
  getList: ReturnType<typeof makeGetFollowList>;
};
