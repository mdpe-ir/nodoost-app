import type { Candidate, MapUser, ActiveFilter, PeerProfile, SwipeAction, MatchResult } from '@/domain/entities';

export interface DiscoveryRepository {
  getCandidates(): Promise<Candidate[]>;
  getExplore(page?: number, limit?: number, tier?: number, active?: ActiveFilter): Promise<Candidate[]>;
  getNearbyMapUsers(radiusM?: number, active?: ActiveFilter): Promise<MapUser[]>;
  swipe(targetId: number, action: SwipeAction): Promise<MatchResult>;
  /** پروفایلِ عمومیِ یک کاربرِ دیگر. */
  getProfile(userId: number): Promise<PeerProfile>;
}
