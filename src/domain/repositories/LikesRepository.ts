import type { Liker, LikesOverview, ViewersOverview, Page } from '@/domain/entities';

export interface LikesRepository {
  /** کسانی که مرا پسندیده‌اند — صفحه‌بندی‌شده (پیش‌فرض صفحه‌ی ۱). */
  getOverview(page?: number): Promise<LikesOverview>;
  /** کسانی که من پسندیده‌ام — همیشه آشکار، صفحه‌بندی‌شده. */
  getSent(page?: number): Promise<Page<Liker>>;
  /** بازدیدکنندگانِ پروفایلم — فهرست از طلایی، آمار از الماس. */
  getViewers(): Promise<ViewersOverview>;
}
