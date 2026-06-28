import type { ChatRepository } from '@/domain/repositories/ChatRepository';
import type { Conversation, Message } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { ConversationDTO, MessageDTO } from '@/data/dto';
import { toConversation, toMessage } from '@/data/mappers';

export class ChatRepositoryImpl implements ChatRepository {
  constructor(private readonly http: HttpClient) {}

  async getConversations(): Promise<Conversation[]> {
    const d = await this.http.request<{ conversations: ConversationDTO[] }>('/api/matches');
    return (d?.conversations ?? []).map(toConversation);
  }

  async getMessages(matchId: number): Promise<Message[]> {
    const d = await this.http.request<{ messages: MessageDTO[] }>(
      `/api/matches/${matchId}/messages`
    );
    return (d?.messages ?? []).map(toMessage);
  }

  async sendMessage(matchId: number, body: string): Promise<Message> {
    const dto = await this.http.request<MessageDTO>(`/api/matches/${matchId}/messages`, {
      method: 'POST',
      body: { body },
    });
    return toMessage(dto);
  }
}
