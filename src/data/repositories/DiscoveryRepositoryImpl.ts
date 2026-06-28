import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { Candidate, SwipeAction, MatchResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { CandidateDTO, MatchDTO } from '@/data/dto';
import { toCandidate, toMatchResult } from '@/data/mappers';

export class DiscoveryRepositoryImpl implements DiscoveryRepository {
  constructor(private readonly http: HttpClient) {}

  async getCandidates(): Promise<Candidate[]> {
    const d = await this.http.request<{ results: CandidateDTO[] }>('/api/discovery');
    return (d?.results ?? []).map(toCandidate);
  }

  async swipe(targetId: number, action: SwipeAction): Promise<MatchResult> {
    const d = await this.http.request<{ match?: MatchDTO }>('/api/swipes', {
      method: 'POST',
      body: { target_id: targetId, action },
    });
    return toMatchResult(d?.match);
  }
}
