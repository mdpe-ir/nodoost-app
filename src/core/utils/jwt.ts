/**
 * خواندنِ claimهای یک JWT **بدونِ اعتبارسنجیِ امضا**.
 *
 * چرا بی‌خطر است: توکنِ خودِ ماست و از SecureStore/حافظه‌ی محلی خوانده می‌شود؛
 * این‌جا فقط می‌خواهیم بفهمیم توکنِ ذخیره‌شده به کدام کاربر و کدام نشست تعلق
 * دارد — یکی برای مهاجرتِ کاربرانِ تک‌حسابی به چنداکانتی، و دیگری برای فرستادنِ
 * شناسه‌ی نشست هنگام خروج. اعتبارسنجیِ واقعی همیشه کارِ سرور است و کلاینتی که
 * خودش توکن را در دست دارد، چیزی برای جعل‌کردن ندارد.
 *
 * دیکدِ base64 عمداً دستی است: `atob` روی همه‌ی موتورهای جاوااسکریپتِ RN موجود
 * نیست و آوردنِ یک وابستگیِ تازه برای دو تابع نمی‌ارزد.
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string | null {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < normalized.length + padding; i++) {
    const ch = i < normalized.length ? normalized[i] : '=';
    if (ch === '=') break;
    const idx = B64.indexOf(ch);
    if (idx < 0) return null;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return out;
}

/** بدنه‌ی JSON توکن، یا `null` اگر توکن ناقص/نامعتبر باشد. */
function jwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 3) return null;
  const raw = base64UrlDecode(parts[1]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** شناسه‌ی کاربرِ صاحبِ توکن (`sub`) — یا `null`. */
export function jwtSubject(token?: string | null): number | null {
  const sub = jwtPayload(token)?.sub;
  const n = typeof sub === 'string' ? Number(sub) : typeof sub === 'number' ? sub : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** شناسه‌ی نشست (`sid`) — فقط توکن‌های تازه دارند؛ توکن‌های قدیمی `null`. */
export function jwtSessionId(token?: string | null): string | null {
  const sid = jwtPayload(token)?.sid;
  return typeof sid === 'string' && sid.length > 0 ? sid : null;
}
