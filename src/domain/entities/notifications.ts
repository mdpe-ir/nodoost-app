/** گونه‌ی اعلان — سرور تعیین می‌کند و متنِ آماده هم خودش می‌فرستد. */
export type NotificationKind =
  | 'follow'
  | 'like'
  | 'super_like'
  | 'match'
  | 'message'
  | 'profile_view'
  | 'system';

/** کنش‌گرِ یک اعلان (کسی که کار را انجام داده). */
export interface NotificationActor {
  id: number;
  name?: string;
  photoUrl?: string;
  tier?: number;
}

/**
 * یک اعلان. `title` و `body` متنِ فارسیِ *آماده‌ی* سرور است — سمتِ کلاینت
 * هیچ متنی ساخته نمی‌شود؛ فقط نمایش داده می‌شود.
 */
export interface AppNotification {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  /** اگر قفل باشد خالی است (سرور هویت را نمی‌فرستد). */
  actors: NotificationActor[];
  /** چند نفر/چند بار — برای آواتارهای روی‌هم و شمارنده. */
  count: number;
  /** سطحِ اشتراکِ کاربر اجازه‌ی دیدنِ «چه کسی» را نمی‌دهد. */
  locked: boolean;
  entityId?: number;
  /** دیپ‌لینکِ مقصد (‎nodoost://…‎)؛ برای قفل‌ها به صفحه‌ی سطح‌ها می‌رود. */
  linkUrl?: string;
  seen: boolean;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** شمارنده‌های نشانِ اپ — زنگوله و تبِ گفتگو از این می‌آیند. */
export interface Badges {
  /** دیده‌نشده‌ها → نشانِ زنگوله. */
  notifications: number;
  unreadNotifications: number;
  unreadMessages: number;
  /** تعدادِ گفتگوهای دارای پیامِ خوانده‌نشده → نشانِ تبِ گفتگو. */
  unreadThreads: number;
}

/** ترجیحاتِ اعلان — همه بولی. */
export interface NotificationPrefs {
  follows: boolean;
  likes: boolean;
  messages: boolean;
  matches: boolean;
  profileViews: boolean;
  system: boolean;
}
