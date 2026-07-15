import type { ChatRepository, MessagePageOptions } from '@/domain/repositories/ChatRepository';

export const makeGetConversations = (r: ChatRepository) => (page?: number) =>
  r.getConversations(page);
export const makeGetMessages =
  (r: ChatRepository) => (matchId: number, opts?: MessagePageOptions) =>
    r.getMessages(matchId, opts);
export const makeStartDirect =
  (r: ChatRepository) => (userId: number) => r.startDirect(userId);
export const makeSendMessage =
  (r: ChatRepository) => (matchId: number, body: string) =>
    r.sendMessage(matchId, body);

export type ChatUseCases = {
  getConversations: ReturnType<typeof makeGetConversations>;
  getMessages: ReturnType<typeof makeGetMessages>;
  sendMessage: ReturnType<typeof makeSendMessage>;
  startDirect: ReturnType<typeof makeStartDirect>;
};
