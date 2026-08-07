import type { BlockedUser, Page } from '@/domain/entities';

export interface SafetyRepository {
  /** بلاک رابطه‌ی دنبال‌کردن را هم در هر دو جهت پاک می‌کند (سمتِ سرور). */
  block(targetId: number): Promise<void>;
  unblock(targetId: number): Promise<void>;
  /**
   * کاربرانی که مسدود کرده‌ام. تنها راهِ رسیدن به آن‌هاست: کاربرِ بلاک‌شده از
   * کشف، فهرست‌ها و گفتگوها غیب می‌شود، پس بدونِ این صفحه رفعِ بلاک ممکن نیست.
   */
  listBlocks(page?: number): Promise<Page<BlockedUser>>;
  report(targetId: number, reason: string, photoId?: number, messageId?: number): Promise<void>;
}
