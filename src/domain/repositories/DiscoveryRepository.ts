import type { Candidate, MapQuery, MapUsersResult, ActiveFilter, PeerProfile, SwipeAction, MatchResult } from '@/domain/entities';

export interface DiscoveryRepository {
  getCandidates(): Promise<Candidate[]>;
  getExplore(page?: number, limit?: number, tier?: number, active?: ActiveFilter): Promise<Candidate[]>;
  getNearbyMapUsers(query?: MapQuery): Promise<MapUsersResult>;
  swipe(targetId: number, action: SwipeAction): Promise<MatchResult>;
  /** پس‌گرفتنِ کنشِ قبلی (پسند/رد) روی یک کاربر — اگر مچ شده باشند سرور اجازه نمی‌دهد. */
  unswipe(targetId: number): Promise<void>;
  /** پروفایلِ عمومیِ یک کاربرِ دیگر. */
  getProfile(userId: number): Promise<PeerProfile>;
}
