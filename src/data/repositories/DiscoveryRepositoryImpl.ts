import type { DiscoveryRepository } from '@/domain/repositories/DiscoveryRepository';
import type { Candidate, MapQuery, MapUsersResult, ActiveFilter, PeerProfile, SwipeAction, MatchResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { CandidateDTO, MapNearbyDTO, PeerProfileDTO } from '@/data/dto';
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

  async getNearbyMapUsers(query: MapQuery = {}): Promise<MapUsersResult> {
    const params = new URLSearchParams();
    // شعاع اختیاری است؛ اگر ندهیم سرور سقفِ سطح را می‌گذارد و در پاسخ برمی‌گرداند.
    if (query.radiusM != null) params.set('radius_m', String(Math.round(query.radiusM)));
    if (query.active) params.set('active', query.active);
    if (query.verified) params.set('verified', '1');
    const qs = params.toString();
    const d = await this.http.request<MapNearbyDTO>(`/api/map/nearby${qs ? `?${qs}` : ''}`);
    return {
      users: (d?.results ?? []).map(toMapUser),
      maxRadiusKm: d?.max_radius_km ?? 0,
    };
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

  async unswipe(targetId: number): Promise<void> {
    await this.http.request(`/api/swipes/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
  }
}
