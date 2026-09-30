import type {
  ChatRepository,
  DeleteScope,
  MessagePageOptions,
  SendMediaOptions,
  SharedMediaPageOptions,
} from '@/domain/repositories/ChatRepository';
import type {
  Conversation,
  Message,
  MessageSearchPage,
  Page,
  Presence,
  SharedMediaPage,
  ThreadState,
} from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type {
  ConversationDTO,
  MessageDTO,
  MessageSearchResponseDTO,
  PresenceDTO,
  SharedMediaResponseDTO,
  ThreadStateDTO,
} from '@/data/dto';
import { resolveChatMediaUri } from '@/core/media/fetchChatMedia';
import {
  toConversation,
  toMessage,
  toMessageSearchPage,
  toPresence,
  toSharedMediaItem,
  toThreadState,
} from '@/data/mappers';

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

  async getSharedMedia(
    matchId: number,
    kind: 'photo' | 'voice',
    opts?: SharedMediaPageOptions
  ): Promise<SharedMediaPage> {
    const params = new URLSearchParams({ kind });
    if (opts?.before != null) params.set('before', String(opts.before));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const d = await this.http.request<SharedMediaResponseDTO>(
      `/api/matches/${matchId}/media?${params.toString()}`
    );
    return {
      items: (d?.items ?? []).map(toSharedMediaItem),
      hasMore: Boolean(d?.has_more),
      counts: { photo: d?.counts?.photo ?? 0, voice: d?.counts?.voice ?? 0 },
    };
  }

  async startDirect(userId: number): Promise<number> {
    const d = await this.http.request<{ match_id: number }>('/api/matches/direct', {
      method: 'POST',
      body: { user_id: userId },
    });
    return d.match_id;
  }

  async getThreadState(matchId: number): Promise<ThreadState> {
    const d = await this.http.request<ThreadStateDTO>(`/api/matches/${matchId}/state`);
    return toThreadState(d);
  }

  async setThreadMuted(matchId: number, muted: boolean): Promise<void> {
    await this.http.request(`/api/matches/${matchId}/mute`, {
      method: muted ? 'POST' : 'DELETE',
    });
  }

  async setPinnedMessage(matchId: number, messageId: number | null): Promise<void> {
    if (messageId == null) {
      await this.http.request(`/api/matches/${matchId}/pin`, { method: 'DELETE' });
    } else {
      await this.http.request(`/api/matches/${matchId}/pin/${messageId}`, { method: 'POST' });
    }
  }

  async searchMessages(
    matchId: number,
    q: string,
    opts?: MessagePageOptions
  ): Promise<MessageSearchPage> {
    const params = new URLSearchParams({ q });
    if (opts?.before != null) params.set('before', String(opts.before));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const d = await this.http.request<MessageSearchResponseDTO>(
      `/api/matches/${matchId}/messages/search?${params.toString()}`
    );
    return toMessageSearchPage(d);
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
    opts?: SendMediaOptions
  ): Promise<Message> {
    const name = uri.split('/').pop() || (kind === 'voice' ? 'voice.m4a' : 'photo.jpg');
    const parameters: Record<string, string> = { kind };
    if (opts?.replyToId != null) parameters.reply_to_id = String(opts.replyToId);
    if (opts?.durationMs != null) parameters.duration_ms = String(opts.durationMs);
    if (opts?.peaks?.length) parameters.peaks = JSON.stringify(opts.peaks);

    const dto = await this.http.uploadFormWithProgress<MessageDTO>(
      `/api/matches/${matchId}/messages`,
      {
        fileUri: uri,
        fieldName: 'file',
        fileName: name,
        mimeType: opts?.mime ?? (kind === 'voice' ? 'audio/mp4' : 'image/jpeg'),
        parameters,
      },
      opts?.onProgress
    );
    return toMessage(dto);
  }

  async resolveMediaUri(
    matchId: number,
    messageId: number,
    kind: 'photo' | 'voice',
    mime?: string,
    onProgress?: (ratio: number) => void
  ): Promise<string> {
    return resolveChatMediaUri(this.http, matchId, messageId, kind, mime, onProgress);
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
