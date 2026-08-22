/** مسیرِ API برای دریافتِ رسانه‌ی یک پیام (نیاز به Authorization دارد). */
export function chatMediaPath(matchId: number, messageId: number): string {
  return `/api/matches/${matchId}/messages/${messageId}/media`;
}
