import type { NotificationsRepository } from '@/domain/repositories/NotificationsRepository';
import type { AppNotification, Badges, NotificationPrefs, Page } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { BadgesDTO, NotificationDTO, NotificationPrefsDTO, PagedDTO } from '@/data/dto';
import { toBadges, toNotification, toNotificationPrefs, fromNotificationPrefs } from '@/data/mappers';

export class NotificationsRepositoryImpl implements NotificationsRepository {
  constructor(private readonly http: HttpClient) {}

  async list(page = 1): Promise<Page<AppNotification>> {
    const d = await this.http.request<PagedDTO<NotificationDTO>>(
      `/api/me/notifications?page=${page}`
    );
    return {
      items: (d?.results ?? []).map(toNotification),
      page: d?.page ?? page,
      total: d?.total,
      hasMore: Boolean(d?.has_more),
    };
  }

  async markAllSeen(): Promise<void> {
    await this.http.request<unknown>('/api/me/notifications/seen', { method: 'POST' });
  }

  async markRead(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.http.request<unknown>('/api/me/notifications/read', {
      method: 'POST',
      body: { ids },
    });
  }

  async markAllRead(): Promise<void> {
    await this.http.request<unknown>('/api/me/notifications/read', {
      method: 'POST',
      body: { all: true },
    });
  }

  async getBadges(): Promise<Badges> {
    const d = await this.http.request<BadgesDTO>('/api/me/badges');
    return toBadges(d);
  }

  async getPrefs(): Promise<NotificationPrefs> {
    const d = await this.http.request<NotificationPrefsDTO>('/api/me/notification-prefs');
    return toNotificationPrefs(d);
  }

  async updatePrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const d = await this.http.request<NotificationPrefsDTO>('/api/me/notification-prefs', {
      method: 'PUT',
      body: fromNotificationPrefs(patch),
    });
    return toNotificationPrefs(d);
  }
}
