import type { Conversation, Message } from '@/domain/entities';

export interface ChatRepository {
  getConversations(): Promise<Conversation[]>;
  getMessages(matchId: number): Promise<Message[]>;
  sendMessage(matchId: number, body: string): Promise<Message>;
  /** گفتگوی مستقیم با یک کاربر را باز می‌کند (اگر نبود، می‌سازد) و matchId می‌دهد. */
  startDirect(userId: number): Promise<number>;
}
