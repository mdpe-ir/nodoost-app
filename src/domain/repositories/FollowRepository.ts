import type { FollowListKind, FollowState, FollowUser, Page } from '@/domain/entities';

/** گرافِ دنبال‌کردن — همه‌ی کنش‌ها برای هر سطحی رایگان‌اند. */
export interface FollowRepository {
  follow(userId: number): Promise<FollowState>;
  unfollow(userId: number): Promise<FollowState>;
  /** فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌های یک کاربر؛ `userId` تهی یعنی خودم. */
  getList(kind: FollowListKind, userId?: number, page?: number): Promise<Page<FollowUser>>;
  /** «او دیگر مرا دنبال نکند» — رابطه از سمتِ مقابل قطع می‌شود، بی‌صدا. */
  removeFollower(userId: number): Promise<FollowState>;
}
