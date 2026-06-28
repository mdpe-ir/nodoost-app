import type { ChatRepository } from '@/domain/repositories/ChatRepository';

export const makeGetConversations = (r: ChatRepository) => () => r.getConversations();
export const makeGetMessages = (r: ChatRepository) => (matchId: number) =>
  r.getMessages(matchId);
export const makeSendMessage =
  (r: ChatRepository) => (matchId: number, body: string) =>
    r.sendMessage(matchId, body);

export type ChatUseCases = {
  getConversations: ReturnType<typeof makeGetConversations>;
  getMessages: ReturnType<typeof makeGetMessages>;
  sendMessage: ReturnType<typeof makeSendMessage>;
};
