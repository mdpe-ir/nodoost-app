import type { Conversation, Message } from '@/domain/entities';

export interface ChatRepository {
  getConversations(): Promise<Conversation[]>;
  getMessages(matchId: number): Promise<Message[]>;
  sendMessage(matchId: number, body: string): Promise<Message>;
}
