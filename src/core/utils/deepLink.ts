/** طرحِ دیپ‌لینکِ اپ — سرور مقصدِ اعلان‌ها را با همین می‌فرستد. */
const SCHEME = 'nodoost://';

/**
 * دیپ‌لینکِ سرور را به مسیرِ expo-router تبدیل می‌کند:
 * `nodoost://user/12` → `/user/12`
 * `nodoost://plans?required=1&feature=likes` → `/plans?required=1&feature=likes`
 * ورودیِ نامعتبر/خالی → null (یعنی «جایی نرو»).
 */
export function toAppPath(link?: string | null): string | null {
  if (!link) return null;
  const raw = link.trim();
  if (!raw) return null;
  // مسیرِ نسبی را همان‌طور برمی‌گردانیم.
  if (raw.startsWith('/')) return raw;
  if (!raw.toLowerCase().startsWith(SCHEME)) return null;
  const rest = raw.slice(SCHEME.length).replace(/^\/+/, '');
  if (!rest) return null;
  return `/${rest}`;
}
