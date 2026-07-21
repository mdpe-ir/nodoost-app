/**
 * وضعیتِ گرافِ دنبال‌کردن بینِ من و یک کاربر.
 * دنبال‌کردن برای همه‌ی سطح‌ها رایگان است — هرگز پشتِ قفلِ اشتراک نمی‌رود.
 */
export interface FollowState {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followersCount: number;
  followingCount: number;
}

/** یک نفر در فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌ها. */
export interface FollowUser {
  id: number;
  name?: string;
  age?: number;
  photoUrl?: string;
  tier?: number;
  verified?: boolean;
  /** آیا من او را دنبال می‌کنم — برای دکمه‌ی هر سطر. */
  isFollowing: boolean;
}

/** کدام فهرست را می‌خواهیم. */
export type FollowListKind = 'followers' | 'following';
