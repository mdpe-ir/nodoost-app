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
export const makeEditMessage =
  (r: ChatRepository) => (messageId: number, body: string) => r.editMessage(messageId, body);
export const makeDeleteMessage =
  (r: ChatRepository) => (messageId: number, scope: DeleteScope) =>
    r.deleteMessage(messageId, scope);
export const makeClearChat = (r: ChatRepository) => (matchId: number) => r.clearChat(matchId);

export type ChatUseCases = {
  getConversations: ReturnType<typeof makeGetConversations>;
  getMessages: ReturnType<typeof makeGetMessages>;
  sendMessage: ReturnType<typeof makeSendMessage>;
  startDirect: ReturnType<typeof makeStartDirect>;
  editMessage: ReturnType<typeof makeEditMessage>;
  deleteMessage: ReturnType<typeof makeDeleteMessage>;
  clearChat: ReturnType<typeof makeClearChat>;
};
