import type { FollowRepository } from '@/domain/repositories/FollowRepository';
import type { FollowListKind, FollowState, FollowUser, Page } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { FollowStateDTO, FollowUserDTO, PagedDTO } from '@/data/dto';
import { toFollowState, toFollowUser } from '@/data/mappers';

export class FollowRepositoryImpl implements FollowRepository {
  constructor(private readonly http: HttpClient) {}

  async follow(userId: number): Promise<FollowState> {
    const d = await this.http.request<FollowStateDTO>(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
    return toFollowState(d);
  }

  async unfollow(userId: number): Promise<FollowState> {
    const d = await this.http.request<FollowStateDTO>(`/api/users/${userId}/follow`, {
      method: 'DELETE',
    });
    return toFollowState(d);
  }

  async getList(kind: FollowListKind, userId?: number, page = 1): Promise<Page<FollowUser>> {
    // بدونِ شناسه یعنی «خودم» — سرور مسیرِ ‎/me/…‎ را برای آن دارد.
    const base = userId ? `/api/users/${userId}` : '/api/me';
    const d = await this.http.request<PagedDTO<FollowUserDTO>>(`${base}/${kind}?page=${page}`);
    return {
      items: (d?.results ?? []).map(toFollowUser),
      page: d?.page ?? page,
      total: d?.total,
      hasMore: Boolean(d?.has_more),
    };
  }
}
