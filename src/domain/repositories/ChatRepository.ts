import type { Conversation, Message, Page, Presence } from '@/domain/entities';

/** گزینه‌های صفحه‌بندیِ تاریخچه‌ی پیام: پیش از این شناسه‌ی پیام. */
export interface MessagePageOptions {
  /** فقط پیام‌های قدیمی‌تر از این شناسه (برای بارگذاریِ گذشته). */
  before?: number;
  limit?: number;
}

/** «برای من» فقط از دیدِ خودم پنهان می‌کند؛ «برای همه» سنگِ قبر می‌گذارد. */
export type DeleteScope = 'me' | 'all';

/** گزینه‌های ارسالِ رسانه‌ی گفتگو. */
export interface SendMediaOptions {
  replyToId?: number;
  durationMs?: number;
  peaks?: number[];
  mime?: string;
  /** پیشرفتِ آپلود ۰ تا ۱. */
  onProgress?: (ratio: number) => void;
}

export interface ChatRepository {
  getConversations(page?: number): Promise<Page<Conversation>>;
  getMessages(matchId: number, opts?: MessagePageOptions): Promise<Message[]>;
  sendMessage(matchId: number, body: string, replyToId?: number): Promise<Message>;
  sendMediaMessage(
    matchId: number,
    kind: 'photo' | 'voice',
    uri: string,
    opts?: SendMediaOptions
  ): Promise<Message>;
  resolveMediaUri(
    matchId: number,
    messageId: number,
    kind: 'photo' | 'voice',
    mime?: string,
    onProgress?: (ratio: number) => void
  ): Promise<string>;
  /** گفتگوی مستقیم با یک کاربر را باز می‌کند (اگر نبود، می‌سازد) و matchId می‌دهد. */
  startDirect(userId: number): Promise<number>;
  /** متنِ پیامِ خودم را عوض می‌کند (فقط داخلِ پنجره‌ی مجاز). */
  editMessage(messageId: number, body: string): Promise<{ body: string; editedAt?: string }>;
  deleteMessage(messageId: number, scope: DeleteScope): Promise<void>;
  /** تاریخچه را فقط برای خودم پاک می‌کند؛ طرفِ مقابل چیزی نمی‌بیند. */
  clearChat(matchId: number): Promise<void>;
  getPresence(matchId: number): Promise<Presence>;
  /** اعلامِ «در حالِ تایپم». کم‌تواتر صدا زده می‌شود، نه با هر کلید. */
  sendTyping(matchId: number): Promise<void>;
}
