import type { NotificationsRepository } from '@/domain/repositories/NotificationsRepository';
import type { NotificationPrefs } from '@/domain/entities';

export const makeGetNotifications = (r: NotificationsRepository) => (page?: number) => r.list(page);
export const makeMarkNotificationsSeen = (r: NotificationsRepository) => () => r.markAllSeen();
export const makeMarkNotificationsRead = (r: NotificationsRepository) => (ids: number[]) =>
  r.markRead(ids);
export const makeMarkAllNotificationsRead = (r: NotificationsRepository) => () => r.markAllRead();
export const makeGetBadges = (r: NotificationsRepository) => () => r.getBadges();
export const makeGetNotificationPrefs = (r: NotificationsRepository) => () => r.getPrefs();
export const makeUpdateNotificationPrefs =
  (r: NotificationsRepository) => (patch: Partial<NotificationPrefs>) =>
    r.updatePrefs(patch);

export type NotificationsUseCases = {
  list: ReturnType<typeof makeGetNotifications>;
  markSeen: ReturnType<typeof makeMarkNotificationsSeen>;
  markRead: ReturnType<typeof makeMarkNotificationsRead>;
  markAllRead: ReturnType<typeof makeMarkAllNotificationsRead>;
  getBadges: ReturnType<typeof makeGetBadges>;
  getPrefs: ReturnType<typeof makeGetNotificationPrefs>;
  updatePrefs: ReturnType<typeof makeUpdateNotificationPrefs>;
};
