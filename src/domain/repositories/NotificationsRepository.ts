import type { AppNotification, Badges, NotificationPrefs, Page } from '@/domain/entities';

export interface NotificationsRepository {
  /** فهرستِ اعلان‌ها — صفحه‌بندی‌شده (پیش‌فرض صفحه‌ی ۱). */
  list(page?: number): Promise<Page<AppNotification>>;
  /** همه را «دیده‌شده» می‌کند — نشانِ زنگوله صفر می‌شود، برجستگیِ کارت‌ها می‌ماند. */
  markAllSeen(): Promise<void>;
  /** «خوانده‌شده» کردنِ چند اعلان یا همه. */
  markRead(ids: number[]): Promise<void>;
  markAllRead(): Promise<void>;
  /** شمارنده‌های نشان (زنگوله + تبِ گفتگو). */
  getBadges(): Promise<Badges>;
  getPrefs(): Promise<NotificationPrefs>;
  updatePrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs>;
}
