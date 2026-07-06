import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { SwipeAction } from '@/domain/entities';

export const makeGetCandidates = (r: DiscoveryRepository) => () => r.getCandidates();
export const makeGetNearbyMapUsers =
  (r: DiscoveryRepository) => (radiusM?: number) => r.getNearbyMapUsers(radiusM);
export const makeSwipe =
  (r: DiscoveryRepository) => (targetId: number, action: SwipeAction) =>
    r.swipe(targetId, action);

export type DiscoveryUseCases = {
  getCandidates: ReturnType<typeof makeGetCandidates>;
  getNearbyMapUsers: ReturnType<typeof makeGetNearbyMapUsers>;
  swipe: ReturnType<typeof makeSwipe>;
};
