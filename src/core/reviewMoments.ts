/**
 * «لحظه‌های خوش» — سیگنالی که ReviewPromptProvider منتظرش است تا پنجره‌ی درخواستِ
 * نظر را باز کند.
 *
 * چرا یک ماژولِ سراسریِ سبک و نه context: viewmodelها (مَچ، ارسالِ پیام، خرید)
 * باید بدونِ وابستگی به درختِ React بتوانند رویداد بفرستند — دقیقاً همان دلیلی که
 * `src/core/installNag.ts` هم به این شکل نوشته شده.
 *
 * برخلافِ installNag این‌جا چیزی ماندگار نمی‌شود: شمارشِ نشستی است و منبعِ حقیقتِ
 * وضعیت (چند بار پرسیده‌ایم، کاربر چه گفته) سمتِ سرور است.
 */

/**
 *  - `match`    مَچِ تازه — قوی‌ترین لحظه‌ی خوش در یک اپِ دوست‌یابی
 *  - `purchase` خریدِ موفقِ اشتراک
 *  - `action`   کنشِ معنادار (لایک، ارسالِ پیام) — فقط برای تریگرِ پشتیبان شمرده می‌شود
 */
export type ReviewMoment = 'match' | 'purchase' | 'action';

type Listener = (moment: ReviewMoment, actions: number) => void;
const listeners = new Set<Listener>();

let actionCount = 0;

/** شمارنده‌ی کنش‌های همین نشست (برای تریگرِ پشتیبان). */
export function reviewActionCount(): number {
  return actionCount;
}

/** ثبتِ یک لحظه. `action` شمارنده را بالا می‌برد؛ بقیه فوری معنا دارند. */
export function recordReviewMoment(moment: ReviewMoment): void {
  if (moment === 'action') actionCount += 1;
  listeners.forEach((l) => l(moment, actionCount));
}

export function subscribeReviewMoments(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
