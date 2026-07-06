import type { LikesRepository } from '@/domain/repositories/LikesRepository';
import type { Liker, LikesOverview } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { LikerDTO } from '@/data/dto';
import { toLiker } from '@/data/mappers';

export class LikesRepositoryImpl implements LikesRepository {
  constructor(private readonly http: HttpClient) {}

  async getOverview(): Promise<LikesOverview> {
    const d = await this.http.request<{ count: number; revealed: boolean; results: LikerDTO[] }>(
      '/api/me/likes'
    );
    return {
      count: d?.count ?? 0,
      revealed: Boolean(d?.revealed),
      likers: (d?.results ?? []).map(toLiker),
    };
  }

  async getSent(): Promise<Liker[]> {
    const d = await this.http.request<{ count: number; results: LikerDTO[] }>(
      '/api/me/likes/sent'
    );
    return (d?.results ?? []).map(toLiker);
  }
}
