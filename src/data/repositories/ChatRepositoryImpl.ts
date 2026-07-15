import type { ChatRepository, MessagePageOptions } from '@/domain/repositories/ChatRepository';
import type { Conversation, Message, Page } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { ConversationDTO, MessageDTO } from '@/data/dto';
import { toConversation, toMessage } from '@/data/mappers';

export class ChatRepositoryImpl implements ChatRepository {
  constructor(private readonly http: HttpClient) {}

  async getConversations(page = 1): Promise<Page<Conversation>> {
    const d = await this.http.request<{
      conversations: ConversationDTO[];
      page?: number;
      has_more?: boolean;
    }>(`/api/matches?page=${page}`);
    return {
      items: (d?.conversations ?? []).map(toConversation),
      page: d?.page ?? page,
      hasMore: Boolean(d?.has_more),
    };
  }

  async getMessages(matchId: number, opts?: MessagePageOptions): Promise<Message[]> {
    const params = new URLSearchParams();
    if (opts?.before != null) params.set('before', String(opts.before));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const d = await this.http.request<{ messages: MessageDTO[] }>(
      `/api/matches/${matchId}/messages${qs ? `?${qs}` : ''}`
    );
    return (d?.messages ?? []).map(toMessage);
  }

  async startDirect(userId: number): Promise<number> {
    const d = await this.http.request<{ match_id: number }>('/api/matches/direct', {
      method: 'POST',
      body: { user_id: userId },
    });
    return d.match_id;
  }

  async sendMessage(matchId: number, body: string): Promise<Message> {
    const dto = await this.http.request<MessageDTO>(`/api/matches/${matchId}/messages`, {
      method: 'POST',
      body: { body },
    });
    return toMessage(dto);
  }
}
