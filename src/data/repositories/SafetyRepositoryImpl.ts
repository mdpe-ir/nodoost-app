import type { SafetyRepository } from '@/domain/repositories/SafetyRepository';
import type { BlockedUser, Page } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { BlockedUserDTO, PagedDTO } from '@/data/dto';
import { toBlockedUser } from '@/data/mappers';

export class SafetyRepositoryImpl implements SafetyRepository {
  constructor(private readonly http: HttpClient) {}

  async block(targetId: number): Promise<void> {
    await this.http.request('/api/safety/block', { method: 'POST', body: { target_id: targetId } });
  }

  async unblock(targetId: number): Promise<void> {
    await this.http.request('/api/safety/unblock', {
      method: 'POST',
      body: { target_id: targetId },
    });
  }

  async listBlocks(page = 1): Promise<Page<BlockedUser>> {
    const d = await this.http.request<PagedDTO<BlockedUserDTO>>(`/api/me/blocks?page=${page}`);
    return {
      items: (d?.results ?? []).map(toBlockedUser),
      page: d?.page ?? page,
      total: d?.total,
      hasMore: Boolean(d?.has_more),
    };
  }

  async report(
    targetId: number,
    reason: string,
    photoId?: number,
    messageId?: number
  ): Promise<void> {
    await this.http.request('/api/safety/report', {
      method: 'POST',
      body: { target_id: targetId, reason, photo_id: photoId, message_id: messageId },
    });
  }
}
