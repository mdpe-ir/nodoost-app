/** یک موضوعِ انتخابی پیش از شروعِ گفتگو با پشتیبانی. */
export interface SupportTopic {
  slug: string;
  label: string;
}

/** حسابِ رسمیِ نودوست، همان‌طور که کاربر می‌بیندش. */
export interface SupportAccount {
  userId: number;
  name?: string;
  photoUrl?: string;
  verified: boolean;
}

export type SupportStatus = 'open' | 'pending' | 'resolved';

/**
 * وضعیتِ کاملِ پشتیبانی برای کاربرِ فعلی — همه‌چیزی که صفحه‌ی پشتیبانی برای
 * رندرِ اولین فریم لازم دارد، در یک درخواست.
 */
export interface SupportOverview {
  /** خاموش یعنی ادمین پشتیبانی را غیرفعال کرده یا هنوز حسابی نساخته. */
  enabled: boolean;
  account?: SupportAccount;
  topics: SupportTopic[];
  welcomeMessage: string;
  /** اگر گفتگویی وجود دارد، شناسه‌ی مچِ آن. */
  matchId?: number;
  topic?: string;
  status?: SupportStatus;
  unread: number;
}
