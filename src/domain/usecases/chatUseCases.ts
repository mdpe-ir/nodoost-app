import type {
  ChatRepository,
  DeleteScope,
  MessagePageOptions,
} from '@/domain/repositories/ChatRepository';

export const makeGetConversations = (r: ChatRepository) => (page?: number) =>
  r.getConversations(page);
export const makeGetMessages =
  (r: ChatRepository) => (matchId: number, opts?: MessagePageOptions) =>
    r.getMessages(matchId, opts);
export const makeStartDirect =
  (r: ChatRepository) => (userId: number) => r.startDirect(userId);
export const makeSendMessage =
  (r: ChatRepository) => (matchId: number, body: string, replyToId?: number) =>
    r.sendMessage(matchId, body, replyToId);
export const makeSendMediaMessage =
  (r: ChatRepository) =>
  (
    matchId: number,
    kind: 'photo' | 'voice',
    uri: string,
    opts?: { replyToId?: number; durationMs?: number; peaks?: number[]; mime?: string }
  ) =>
    r.sendMediaMessage(matchId, kind, uri, opts);
export const makeResolveMediaUri =
  (r: ChatRepository) => (matchId: number, messageId: number, kind: 'photo' | 'voice', mime?: string) =>
    r.resolveMediaUri(matchId, messageId, kind, mime);
export const makeEditMessage =
  (r: ChatRepository) => (messageId: number, body: string) => r.editMessage(messageId, body);
export const makeDeleteMessage =
  (r: ChatRepository) => (messageId: number, scope: DeleteScope) =>
    r.deleteMessage(messageId, scope);
export const makeClearChat = (r: ChatRepository) => (matchId: number) => r.clearChat(matchId);
export const makeGetPresence = (r: ChatRepository) => (matchId: number) => r.getPresence(matchId);
export const makeSendTyping = (r: ChatRepository) => (matchId: number) => r.sendTyping(matchId);

export type ChatUseCases = {
  getConversations: ReturnType<typeof makeGetConversations>;
  getMessages: ReturnType<typeof makeGetMessages>;
  sendMessage: ReturnType<typeof makeSendMessage>;
  sendMediaMessage: ReturnType<typeof makeSendMediaMessage>;
  resolveMediaUri: ReturnType<typeof makeResolveMediaUri>;
  startDirect: ReturnType<typeof makeStartDirect>;
  editMessage: ReturnType<typeof makeEditMessage>;
  deleteMessage: ReturnType<typeof makeDeleteMessage>;
  clearChat: ReturnType<typeof makeClearChat>;
  getPresence: ReturnType<typeof makeGetPresence>;
  sendTyping: ReturnType<typeof makeSendTyping>;
};
