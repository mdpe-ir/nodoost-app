import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { SwipeAction, ActiveFilter, GenderFilter, MapQuery, AgeRange } from '@/domain/entities';

export const makeGetCandidates =
  (r: DiscoveryRepository) => (gender?: GenderFilter, age?: AgeRange) => r.getCandidates(gender, age);
export const makeGetExplore =
  (r: DiscoveryRepository) =>
  (page?: number, limit?: number, tier?: number, active?: ActiveFilter, gender?: GenderFilter, age?: AgeRange) =>
    r.getExplore(page, limit, tier, active, gender, age);
export const makeGetNearbyMapUsers =
  (r: DiscoveryRepository) => (query?: MapQuery) =>
    r.getNearbyMapUsers(query);
export const makeGetPeerProfile =
  (r: DiscoveryRepository) => (userId: number) => r.getProfile(userId);
export const makeSwipe =
  (r: DiscoveryRepository) => (targetId: number, action: SwipeAction) =>
    r.swipe(targetId, action);
export const makeUnswipe =
  (r: DiscoveryRepository) => (targetId: number) => r.unswipe(targetId);

export type DiscoveryUseCases = {
  getCandidates: ReturnType<typeof makeGetCandidates>;
  getExplore: ReturnType<typeof makeGetExplore>;
  getNearbyMapUsers: ReturnType<typeof makeGetNearbyMapUsers>;
  swipe: ReturnType<typeof makeSwipe>;
  unswipe: ReturnType<typeof makeUnswipe>;
  getPeerProfile: ReturnType<typeof makeGetPeerProfile>;
};
