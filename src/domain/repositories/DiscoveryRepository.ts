import type { Candidate, MapUser, PeerProfile, SwipeAction, MatchResult } from '@/domain/entities';

export interface DiscoveryRepository {
  getCandidates(): Promise<Candidate[]>;
  getExplore(page?: number, limit?: number, tier?: number): Promise<Candidate[]>;
  getNearbyMapUsers(radiusM?: number): Promise<MapUser[]>;
  swipe(targetId: number, action: SwipeAction): Promise<MatchResult>;
  /** پروفایلِ عمومیِ یک کاربرِ دیگر. */
  getProfile(userId: number): Promise<PeerProfile>;
}
