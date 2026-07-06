import type { Candidate, MapUser, SwipeAction, MatchResult } from '@/domain/entities';

export interface DiscoveryRepository {
  getCandidates(): Promise<Candidate[]>;
  getExplore(page?: number, limit?: number): Promise<Candidate[]>;
  getNearbyMapUsers(radiusM?: number): Promise<MapUser[]>;
  swipe(targetId: number, action: SwipeAction): Promise<MatchResult>;
}
