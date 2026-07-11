import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { Candidate, MapUser, ActiveFilter, PeerProfile, SwipeAction, MatchResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { CandidateDTO, MapUserDTO, PeerProfileDTO } from '@/data/dto';
import { toCandidate, toMapUser, toPeerProfile } from '@/data/mappers';

// نگاشتِ کنشِ سواایپِ دامنه به مقادیرِ موردِ انتظارِ بک‌اند (like | nope | super)
const API_ACTION: Record<SwipeAction, string> = { like: 'like', super: 'super', pass: 'nope' };

export class DiscoveryRepositoryImpl implements DiscoveryRepository {
  constructor(private readonly http: HttpClient) {}

  async getCandidates(): Promise<Candidate[]> {
    const d = await this.http.request<{ results: CandidateDTO[] }>('/api/discovery');
    return (d?.results ?? []).map(toCandidate);
  }

  async getExplore(page = 1, limit = 24, tier?: number, active?: ActiveFilter): Promise<Candidate[]> {
    const tierParam = tier ? `&tier=${encodeURIComponent(tier)}` : '';
    const activeParam = active ? `&active=${encodeURIComponent(active)}` : '';
    const d = await this.http.request<{ results: CandidateDTO[] }>(
      `/api/explore?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}${tierParam}${activeParam}`
    );
    return (d?.results ?? []).map(toCandidate);
  }

  async getNearbyMapUsers(radiusM = 25000, active?: ActiveFilter): Promise<MapUser[]> {
    const activeParam = active ? `&active=${encodeURIComponent(active)}` : '';
    const d = await this.http.request<{ results: MapUserDTO[] }>(
      `/api/map/nearby?radius_m=${encodeURIComponent(radiusM)}${activeParam}`
    );
    return (d?.results ?? []).map(toMapUser);
  }

  async getProfile(userId: number): Promise<PeerProfile> {
    const d = await this.http.request<PeerProfileDTO>(
      `/api/users/${encodeURIComponent(userId)}/profile`
    );
    return toPeerProfile(d);
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
