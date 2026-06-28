/** یک گفتگو در فهرستِ چت‌ها. */
export interface Conversation {
  matchId: number;
  otherId: number;
  otherName?: string;
  lastBody?: string;
  lastAt?: string;
  unread?: number;
  source?: 'swipe' | 'random';
}

/** یک پیام در گفتگو. */
export interface Message {
  id?: number;
  matchId: number;
  senderId: number;
  body: string;
  createdAt?: string;
}
