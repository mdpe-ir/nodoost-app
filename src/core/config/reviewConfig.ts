/**
 * پیکربندیِ «درخواستِ ثبتِ نظر در کافه‌بازار» — از `GET /api/config` (کلیدِ `review`)
 * می‌آید و کاملاً از پنلِ ادمین ویرایش می‌شود.
 *
 * تقسیمِ کار با سرور: *مجاز بودنِ* پرسش را سرور تصمیم می‌گیرد
 * (`GET /api/me/review-prompt`)، چون سیگنالِ واقعیِ درگیری آن‌جاست و وضعیتِ «هرگز
 * نپرس» باید از نصبِ مجدد جان به در ببرد. این‌جا فقط متن‌ها و تریگرِ سمتِ اپ است.
 *
 * متنِ خالی یعنی «پیش‌فرضِ اپ» — پس نصبی که هیچ‌وقت تنظیم نشده هم جمله‌ی درست دارد.
 */
export interface ReviewConfig {
  enabled: boolean;
  /** بعد از چند کنشِ معنادار در همین نشست، اگر مَچ/خریدی نبود، پرسیده شود. */
  triggerActions: number;
  title: string;
  body: string;
  happyLabel: string;
  unhappyLabel: string;
  laterLabel: string;
  thanksTitle: string;
  thanksBody: string;
  storeLabel: string;
  feedbackPrompt: string;
}

/** متن‌های پیش‌فرض — همان چیزی که وقتی ادمین فیلد را خالی گذاشته نشان داده می‌شود. */
export const reviewCopy = {
  title: 'از نودوست راضی هستی؟',
  body: 'یک جوابِ کوتاه؛ کمک می‌کند بفهمیم کجا خوب بوده‌ایم و کجا نه.',
  happyLabel: 'آره، راضی‌ام',
  unhappyLabel: 'نه چندان',
  laterLabel: 'بعداً',
  thanksTitle: 'چه خوب!',
  thanksBody:
    'اگر یک نظرِ کوتاه در کافه‌بازار بنویسی، خیلی کمک می‌کند بقیه هم نودوست را پیدا کنند.',
  storeLabel: 'ثبتِ نظر در کافه‌بازار',
  feedbackPrompt: 'چه چیزی آزارت داد؟',
} as const;

export const emptyReviewConfig: ReviewConfig = {
  // تا وقتی سرور جواب نداده، هیچ پنجره‌ای نباید باز شود (fail-safe).
  enabled: false,
  triggerActions: 3,
  title: '',
  body: '',
  happyLabel: '',
  unhappyLabel: '',
  laterLabel: '',
  thanksTitle: '',
  thanksBody: '',
  storeLabel: '',
  feedbackPrompt: '',
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** نگاشتِ پاسخِ خامِ سرور (snake_case)؛ در برابرِ فیلدهای گم‌شده مقاوم. */
export function parseReviewConfig(raw: unknown): ReviewConfig {
  const o = (raw ?? {}) as Record<string, unknown>;
  const n = Number(o.trigger_actions);
  return {
    enabled: Boolean(o.enabled),
    triggerActions: Number.isInteger(n) && n > 0 ? n : 3,
    title: str(o.title),
    body: str(o.body),
    happyLabel: str(o.happy_label),
    unhappyLabel: str(o.unhappy_label),
    laterLabel: str(o.later_label),
    thanksTitle: str(o.thanks_title),
    thanksBody: str(o.thanks_body),
    storeLabel: str(o.store_label),
    feedbackPrompt: str(o.feedback_prompt),
  };
}

/** متنِ ادمین اگر پر باشد، وگرنه پیش‌فرضِ اپ. */
export function copyOf(custom: string, fallback: string): string {
  return custom || fallback;
}
