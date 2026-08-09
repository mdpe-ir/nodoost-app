/**
 * وضعیتِ درخواستِ ثبتِ نظر برای کاربرِ جاری.
 *
 * `eligible` را سرور تصمیم می‌گیرد (سنِ حساب، درگیری، کول‌داون، سقفِ دفعات، و
 * اینکه قبلاً «هرگز» یا «ناراضی» نگفته باشد). اپ فقط تصمیم می‌گیرد پنجره را در چه
 * *لحظه‌ای* نشان بدهد.
 */
export interface ReviewPromptState {
  eligible: boolean;
  status: 'pending' | 'later' | 'never' | 'rated' | 'unhappy';
  asks: number;
}

/** کنش‌هایی که اپ درباره‌ی پنجره گزارش می‌کند. */
export type ReviewPromptAction =
  | 'shown'
  | 'happy'
  | 'store_opened'
  | 'later'
  | 'never'
  | 'unhappy';

export interface ReviewPromptRepository {
  get(): Promise<ReviewPromptState>;
  /** `note` فقط با کنشِ `unhappy` معنا دارد و تیکتِ بازخورد می‌سازد. */
  report(action: ReviewPromptAction, note?: string): Promise<void>;
}
