import type { Liker, LikesOverview, ViewersOverview } from '@/domain/entities';

export interface LikesRepository {
  getOverview(): Promise<LikesOverview>;
  /** کسانی که من پسندیده‌ام — همیشه آشکار. */
  getSent(): Promise<Liker[]>;
  /** بازدیدکنندگانِ پروفایلم — فهرست از طلایی، آمار از الماس. */
  getViewers(): Promise<ViewersOverview>;
}
