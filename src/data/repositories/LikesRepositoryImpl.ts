import type { LikesRepository } from '@/domain/repositories/LikesRepository';
import type { Liker, LikesOverview, ViewersOverview, Page } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { LikerDTO, ViewerDTO } from '@/data/dto';
import { toLiker, toViewer } from '@/data/mappers';

export class LikesRepositoryImpl implements LikesRepository {
  constructor(private readonly http: HttpClient) {}

  async getOverview(page = 1): Promise<LikesOverview> {
    const d = await this.http.request<{
      count: number;
      revealed: boolean;
      results: LikerDTO[];
      page?: number;
      has_more?: boolean;
    }>(`/api/me/likes?page=${page}`);
    return {
      count: d?.count ?? 0,
      revealed: Boolean(d?.revealed),
      likers: (d?.results ?? []).map(toLiker),
      page: d?.page ?? page,
      hasMore: Boolean(d?.has_more),
    };
  }

  async getSent(page = 1): Promise<Page<Liker>> {
    const d = await this.http.request<{
      count: number;
      results: LikerDTO[];
      page?: number;
      total?: number;
      has_more?: boolean;
    }>(`/api/me/likes/sent?page=${page}`);
    return {
      items: (d?.results ?? []).map(toLiker),
      page: d?.page ?? page,
      total: d?.total,
      hasMore: Boolean(d?.has_more),
    };
  }

  async getViewers(): Promise<ViewersOverview> {
    const d = await this.http.request<{
      count: number;
      revealed: boolean;
      results: ViewerDTO[];
      total_views?: number;
    }>('/api/me/profile-views');
    return {
      count: d?.count ?? 0,
      revealed: Boolean(d?.revealed),
      viewers: (d?.results ?? []).map(toViewer),
      totalViews: d?.total_views,
    };
  }
}
