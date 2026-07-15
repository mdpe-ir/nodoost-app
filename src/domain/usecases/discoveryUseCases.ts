import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { SwipeAction, ActiveFilter, MapQuery } from '@/domain/entities';

export const makeGetCandidates = (r: DiscoveryRepository) => () => r.getCandidates();
export const makeGetExplore =
  (r: DiscoveryRepository) => (page?: number, limit?: number, tier?: number, active?: ActiveFilter) =>
    r.getExplore(page, limit, tier, active);
export const makeGetNearbyMapUsers =
  (r: DiscoveryRepository) => (query?: MapQuery) =>
    r.getNearbyMapUsers(query);
export const makeGetPeerProfile =
  (r: DiscoveryRepository) => (userId: number) => r.getProfile(userId);
export const makeSwipe =
  (r: DiscoveryRepository) => (targetId: number, action: SwipeAction) =>
    r.swipe(targetId, action);

export type DiscoveryUseCases = {
  getCandidates: ReturnType<typeof makeGetCandidates>;
  getExplore: ReturnType<typeof makeGetExplore>;
  getNearbyMapUsers: ReturnType<typeof makeGetNearbyMapUsers>;
  swipe: ReturnType<typeof makeSwipe>;
  getPeerProfile: ReturnType<typeof makeGetPeerProfile>;
};
