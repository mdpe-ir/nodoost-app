import type { Conversation, Message, Page } from '@/domain/entities';

/** گزینه‌های صفحه‌بندیِ تاریخچه‌ی پیام: پیش از این شناسه‌ی پیام. */
export interface MessagePageOptions {
  /** فقط پیام‌های قدیمی‌تر از این شناسه (برای بارگذاریِ گذشته). */
  before?: number;
  limit?: number;
}

export interface ChatRepository {
  getConversations(page?: number): Promise<Page<Conversation>>;
  getMessages(matchId: number, opts?: MessagePageOptions): Promise<Message[]>;
  sendMessage(matchId: number, body: string): Promise<Message>;
  /** گفتگوی مستقیم با یک کاربر را باز می‌کند (اگر نبود، می‌سازد) و matchId می‌دهد. */
  startDirect(userId: number): Promise<number>;
}
