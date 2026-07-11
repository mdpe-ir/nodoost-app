/** یک گفتگو در فهرستِ چت‌ها. */
export interface Conversation {
  matchId: number;
  otherId: number;
  otherName?: string;
  otherPhotoUrl?: string;
  otherTier?: number;
  lastBody?: string;
  lastAt?: string;
  unread?: number;
  source?: 'swipe' | 'random';
  /** شناسه‌ی شروع‌کننده‌ی گفتگو؛ null یعنی هنوز پیامی رد و بدل نشده. */
  initiatedBy?: number | null;
}

/** یک پیام در گفتگو. */
export interface Message {
  id?: number;
  matchId: number;
  senderId: number;
  body: string;
  createdAt?: string;
  /** زمانِ خوانده‌شدن — سرور فقط روی پیام‌های خودم و برای سطحِ طلایی+ می‌فرستد. */
  readAt?: string;
}
