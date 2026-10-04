/** نتیجه‌ی تأییدِ کدِ ورود. */
export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  /** شناسه‌ی کاربر — کلیدِ اسلاتِ اکانت در حالتِ چنداکانتی. */
  userId?: number;
  /** شناسه‌ی نشستِ سروری (برای خروجِ هدفمند در «دستگاه‌های متصل»). */
  sessionId?: string;
  profileComplete: boolean;
}

export interface AuthSession {
  sid: string;
  platform: string;
  deviceLabel: string;
  createdAt: string;
  lastSeenAt: string;
}
