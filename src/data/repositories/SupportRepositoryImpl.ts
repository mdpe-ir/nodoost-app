import type { SupportRepository } from '@/domain/repositories/SupportRepository';
import type { MessagePageOptions } from '@/domain/repositories/ChatRepository';
import type { Message, SupportOverview } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { MessageDTO, SupportOverviewDTO } from '@/data/dto';
import { toMessage, toSupportOverview } from '@/data/mappers';

export class SupportRepositoryImpl implements SupportRepository {
  constructor(private readonly http: HttpClient) {}

  async getOverview(): Promise<SupportOverview> {
    const d = await this.http.request<SupportOverviewDTO>('/api/support');
    return toSupportOverview(d);
  }

  async startThread(topic: string): Promise<number> {
    const d = await this.http.request<{ match_id: number }>('/api/support/thread', {
      method: 'POST',
      body: { topic },
    });
    return d.match_id;
  }

  async getMessages(opts?: MessagePageOptions): Promise<Message[]> {
    const params = new URLSearchParams();
    if (opts?.before != null) params.set('before', String(opts.before));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const d = await this.http.request<{ messages: MessageDTO[] }>(
      `/api/support/messages${qs ? `?${qs}` : ''}`
    );
    return (d?.messages ?? []).map(toMessage);
  }

  async sendMessage(body: string, topic?: string): Promise<Message> {
    const dto = await this.http.request<MessageDTO>('/api/support/messages', {
      method: 'POST',
      body: { body, topic },
    });
    return toMessage(dto);
  }
}
