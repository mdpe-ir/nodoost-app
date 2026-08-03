import type { InAppMessagesRepository } from '@/domain/repositories/InAppMessagesRepository';
import type { InAppEvent, InAppMessage } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { InAppMessagesDTO } from '@/data/dto';
import { toInAppMessage } from '@/data/mappers';

export class InAppMessagesRepositoryImpl implements InAppMessagesRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<InAppMessage[]> {
    const d = await this.http.request<InAppMessagesDTO>('/api/me/inapp-messages');
    return (d?.results ?? []).map(toInAppMessage);
  }

  async recordEvent(messageId: number, action: InAppEvent): Promise<void> {
    await this.http.request<unknown>(`/api/me/inapp-messages/${messageId}/events`, {
      method: 'POST',
      body: { action },
    });
  }
}
