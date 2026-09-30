import type { AccountStatus } from './user';

/**
 * یک اکانتِ واردشده روی همین دستگاه.
 *
 * شناسه (`id`) همان `sub` توکن است — یعنی شناسه‌ی کاربر. چون شماره در سرور
 * یگانه است، هر کاربر دقیقاً یک اسلات می‌گیرد و ورودِ دوباره‌ی همان شماره
 * یک اکانتِ تکراری نمی‌سازد (فقط توکن‌هایش تازه می‌شود).
 */
export interface AccountMeta {
  /** شناسه‌ی محلی — همان شناسه‌ی کاربر به‌صورت رشته. */
  id: string;
  userId: number;
  phone: string;
  /** نامِ نمایشی؛ تا اولین `GET /api/me` ممکن است خالی باشد. */
  name?: string;
  /** آواتارِ پیش‌فرض؛ برای برگه‌ی سوییچ بدونِ واکشی تازه. */
  photoUrl?: string;
  /** وضعیتِ آخرین‌بارِ دیده‌شده — نشانِ «مسدود/در انتظار تأیید» در برگه. */
  status?: AccountStatus;
  addedAt: number;
  lastUsedAt: number;
}

/**
 * ایندکسِ اکانت‌های دستگاه.
 *
 * توکن‌ها عمداً این‌جا نیستند و در کلیدهای جدا (`nd_access_<id>` /
 * `nd_refresh_<id>`) می‌نشینند: SecureStore روی iOS تاریخی مقادیرِ بالای
 * ~۲۰۴۸ بایت را رد می‌کرد و چند JWT در یک کلید به‌سادگی از آن رد می‌شود.
 */
export interface AccountIndex {
  version: 1;
  activeId: string | null;
  accounts: AccountMeta[];
}

/** ایندکسِ خالی — نقطه‌ی شروعِ تازه‌نصب‌ها. */
export const emptyAccountIndex = (): AccountIndex => ({
  version: 1,
  activeId: null,
  accounts: [],
});

/** هویتِ یک اکانتِ تازه‌وارد — از پاسخِ احراز یا از claimهای توکن. */
export interface AccountInput {
  /** اگر سرور نداده باشد (نسخه‌های قدیمی)، از `sub` توکن خوانده می‌شود. */
  userId?: number;
  phone?: string;
  name?: string;
  photoUrl?: string;
  status?: AccountStatus;
}

/** جفتِ توکنِ یک اکانت به‌همراه شناسه‌ی نشستِ سروری (اگر سرور داده باشد). */
export interface TokenPair {
  access: string;
  refresh?: string | null;
  sessionId?: string | null;
}

