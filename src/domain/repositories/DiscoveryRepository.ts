import type { Candidate, SwipeAction, MatchResult } from '@/domain/entities';

export interface DiscoveryRepository {
  getCandidates(): Promise<Candidate[]>;
  swipe(targetId: number, action: SwipeAction): Promise<MatchResult>;
}
