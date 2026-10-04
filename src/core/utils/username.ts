export const USERNAME_PATTERN = /^[a-zA-Z0-9_]([a-zA-Z0-9._]{0,28}[a-zA-Z0-9_])?$/;

/** Validates an Instagram-style username locally; availability remains server-authoritative. */
export function validateUsername(value: string): string | undefined {
  if (!value) return undefined;
  const s = value.trim();
  if (s.length < 1 || s.length > 30) {
    return 'نام کاربری باید ۱ تا ۳۰ نویسه باشد.';
  }
  if (!USERNAME_PATTERN.test(s)) {
    return 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، زیرخط (_) و نقطه (.) باشد و نباید با نقطه شروع یا تمام شود.';
  }
  if (s.includes('..')) {
    return 'نام کاربری نباید شامل دو نقطه متوالی باشد.';
  }
  return undefined;
}

export interface MentionToken { type: 'text' | 'mention'; value: string; username?: string }
const MENTION = /(^|[^a-zA-Z0-9_.])@([a-zA-Z0-9_](?:[a-zA-Z0-9._]{0,28}[a-zA-Z0-9_])?)(?=[^a-zA-Z0-9_]|$)/g;

/** Splits message text into display-safe text and username mention tokens. */
export function tokenizeMentions(text: string): MentionToken[] {
  const tokens: MentionToken[] = [];
  let last = 0;
  for (const match of text.matchAll(MENTION)) {
    const index = match.index ?? 0;
    const prefix = match[1];
    const username = match[2];
    if (username.includes('..')) continue;
    if (index > last) tokens.push({ type: 'text', value: text.slice(last, index) });
    if (prefix) tokens.push({ type: 'text', value: prefix });
    tokens.push({ type: 'mention', value: `@${username}`, username: username.toLowerCase() });
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens.length ? tokens : [{ type: 'text', value: text }];
}
