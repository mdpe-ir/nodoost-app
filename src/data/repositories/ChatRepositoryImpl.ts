import type {
  ChatRepository,
  DeleteScope,
  MessagePageOptions,
} from '@/domain/repositories/ChatRepository';
import type { Conversation, Message, Page, Presence } from '@/domain/entities';
import { Platform } from 'react-native';
import { File as ExpoFile } from 'expo-file-system';
import type { HttpClient } from '@/core/http/HttpClient';
import type { ConversationDTO, MessageDTO, PresenceDTO } from '@/data/dto';
import { resolveChatMediaUri } from '@/core/media/fetchChatMedia';
import { toConversation, toMessage, toPresence } from '@/data/mappers';

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

  async sendMessage(matchId: number, body: string, replyToId?: number): Promise<Message> {
    const dto = await this.http.request<MessageDTO>(`/api/matches/${matchId}/messages`, {
      method: 'POST',
      body: { body, reply_to_id: replyToId },
    });
    return toMessage(dto);
  }

  async sendMediaMessage(
    matchId: number,
    kind: 'photo' | 'voice',
    uri: string,
    opts?: { replyToId?: number; durationMs?: number; peaks?: number[]; mime?: string }
  ): Promise<Message> {
    const form = new FormData();
    form.append('kind', kind);
    const name = uri.split('/').pop() || (kind === 'voice' ? 'voice.m4a' : 'photo.jpg');
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('file', blob, name);
    } else {
      form.append('file', new ExpoFile(uri), name);
    }
    if (opts?.replyToId != null) form.append('reply_to_id', String(opts.replyToId));
    if (opts?.durationMs != null) form.append('duration_ms', String(opts.durationMs));
    if (opts?.peaks?.length) form.append('peaks', JSON.stringify(opts.peaks));
    const dto = await this.http.uploadForm<MessageDTO>(`/api/matches/${matchId}/messages`, form);
    return toMessage(dto);
  }

  async resolveMediaUri(
    matchId: number,
    messageId: number,
    kind: 'photo' | 'voice',
    mime?: string
  ): Promise<string> {
    return resolveChatMediaUri(this.http, matchId, messageId, kind, mime);
  }

  async editMessage(messageId: number, body: string): Promise<{ body: string; editedAt?: string }> {
    const d = await this.http.request<{ body?: string; edited_at?: string }>(
      `/api/messages/${messageId}`,
      { method: 'PATCH', body: { body } }
    );
    return { body: d?.body ?? body, editedAt: d?.edited_at };
  }

  async deleteMessage(messageId: number, scope: DeleteScope): Promise<void> {
    await this.http.request(`/api/messages/${messageId}?scope=${scope}`, { method: 'DELETE' });
  }

  async getPresence(matchId: number): Promise<Presence> {
    return toPresence(await this.http.request<PresenceDTO>(`/api/matches/${matchId}/presence`));
  }

  async sendTyping(matchId: number): Promise<void> {
    await this.http.request(`/api/matches/${matchId}/typing`, { method: 'POST' });
  }

  async clearChat(matchId: number): Promise<void> {
    await this.http.request(`/api/matches/${matchId}/messages`, { method: 'DELETE' });
  }
}
