import type { RandomRepository } from '@/domain/repositories/RandomRepository';
import type { RandomMatch, RandomFilters } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { CandidateDTO } from '@/data/dto';
import { toCandidate } from '@/data/mappers';

export class RandomRepositoryImpl implements RandomRepository {
  constructor(private readonly http: HttpClient) {}

  async join(filters?: RandomFilters): Promise<RandomMatch> {
    const d = await this.http.request<{
      status: 'waiting' | 'matched';
      match_id?: number;
      peer?: CandidateDTO;
    }>('/api/random/join', {
      method: 'POST',
      body: { gender: filters?.gender, max_distance_m: filters?.maxDistanceM },
    });
    return {
      status: d.status,
      matchId: d.match_id,
      peer: d.peer ? toCandidate(d.peer) : undefined,
    };
  }

  async leave(): Promise<void> {
    await this.http.request('/api/random/leave', { method: 'POST', body: {} });
  }

  async status(): Promise<{ status: string }> {
    return this.http.request<{ status: string }>('/api/random/status');
  }
}
