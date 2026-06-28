import type { LikesRepository } from '@/domain/repositories/LikesRepository';
import type { LikesOverview } from '@/domain/entities';
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
}
