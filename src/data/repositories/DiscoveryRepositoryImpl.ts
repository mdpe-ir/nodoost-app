import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { Candidate, SwipeAction, MatchResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { CandidateDTO } from '@/data/dto';
import { toCandidate } from '@/data/mappers';

// نگاشتِ کنشِ سواایپِ دامنه به مقادیرِ موردِ انتظارِ بک‌اند (like | nope | super)
const API_ACTION: Record<SwipeAction, string> = { like: 'like', super: 'super', pass: 'nope' };

export class DiscoveryRepositoryImpl implements DiscoveryRepository {
  constructor(private readonly http: HttpClient) {}

  async getCandidates(): Promise<Candidate[]> {
    const d = await this.http.request<{ results: CandidateDTO[] }>('/api/discovery');
    return (d?.results ?? []).map(toCandidate);
  }

  async swipe(targetId: number, action: SwipeAction): Promise<MatchResult> {
    // پاسخِ بک‌اند تخت است: { matched, match_id }
    const d = await this.http.request<{ matched?: boolean; match_id?: number }>('/api/swipes', {
      method: 'POST',
      body: { target_id: targetId, action: API_ACTION[action] },
    });
    return { matchId: d?.matched && d.match_id ? d.match_id : undefined };
  }
}
