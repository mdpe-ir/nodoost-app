/** کاندیدای کاوش. */
export interface Candidate {
  id: number;
  name: string;
  age?: number;
  bio?: string;
  distanceM?: number;
  tier?: number;
  photoUrl?: string;
  interests?: string[];
  /** وضعیتِ فعالیت — سرور فقط برای بیننده‌ی نقره‌ای+ می‌فرستد. */
  isOnline?: boolean;
  lastActiveMin?: number;
}

/** یک نشانگرِ کاربر روی نقشه (فازی‌شده، مگر با رضایت صریح کاربر). */
export interface MapUser {
  id: number;
  name: string;
  age?: number;
  photoUrl?: string;
  lat: number;
  lng: number;
  distanceM?: number;
  isMatch?: boolean;
  /** پروفایلِ تأییدشده («چهره‌نما»). */
  verified?: boolean;
  tier?: number;
  /** وضعیتِ فعالیت — سرور فقط برای بیننده‌ی نقره‌ای+ می‌فرستد. */
  isOnline?: boolean;
  lastActiveMin?: number;
}

/** فیلترِ فعالیت در اطراف/نقشه: «1h/today» از برنزی، «online» از نقره‌ای. */
export type ActiveFilter = '' | 'online' | '1h' | 'today';

/** پارامترهای پرس‌وجوی نقشه — شعاع (متر) و فیلترهای عضویتی. */
export interface MapQuery {
  radiusM?: number;
  active?: ActiveFilter;
  /** «چهره‌نما»: فقط پروفایل‌های تأییدشده. */
  verified?: boolean;
}

/** نتیجه‌ی نقشه — نشانگرها به‌همراهِ سقفِ شعاعِ سطحِ کاربر (کیلومتر). */
export interface MapUsersResult {
  users: MapUser[];
  /** سقفِ شعاعِ جست‌وجو برای سطحِ کاربر (کیلومتر) — سرور مرجعِ آن است. */
  maxRadiusKm: number;
}

export type SwipeAction = 'like' | 'super' | 'pass';

/** نتیجه‌ی سواایپ؛ اگر مَچ شود peer پر می‌شود. */
export interface MatchResult {
  matchId?: number;
  peer?: Candidate;
}

/** کسی که مرا پسندیده است. */
export interface Liker {
  id: number;
  name?: string;
  age?: number;
  photoUrl?: string;
  tier?: number;
}

/** پاسخِ بخشِ پسندها (تعداد + آشکار/قفل + فهرستِ صفحه‌بندی‌شده). */
export interface LikesOverview {
  count: number;
  revealed: boolean;
  likers: Liker[];
  /** شماره‌ی صفحه‌ی بارگذاری‌شده‌ی جاری. */
  page: number;
  /** آیا صفحه‌ی بعدی هم هست. */
  hasMore: boolean;
}

/** بازدیدکننده‌ی پروفایل. */
export interface Viewer extends Liker {
  viewedAt?: string;
}

/** پاسخِ بازدیدهای پروفایل — فهرست از طلایی، آمارِ کل از الماس. */
export interface ViewersOverview {
  count: number;
  revealed: boolean;
  viewers: Viewer[];
  /** مجموعِ دفعاتِ بازدید — فقط برای الماس. */
  totalViews?: number;
}

/** پروفایلِ عمومیِ یک کاربرِ دیگر — برای صفحه‌ی نمایشِ پروفایل. */
export interface PeerProfile {
  id: number;
  name?: string;
  age?: number;
  gender?: string;
  bio?: string;
  verified?: boolean;
  tier?: number;
  distanceM?: number;
  isMatch?: boolean;
  /** اگر مچ شده‌اند، برای رفتنِ مستقیم به گفتگو. */
  matchId?: number;
  /** کنشِ خودم روی این کاربر — برای نمایشِ «پسندیدی/لغو» و «نپسندیدی». */
  mySwipe?: 'like' | 'super' | 'nope';
  /** وضعیتِ فعالیت — سرور فقط برای بیننده‌ی نقره‌ای+ می‌فرستد. */
  isOnline?: boolean;
  lastActiveMin?: number;
  /** گرافِ دنبال‌کردن — رایگان برای همه‌ی سطح‌ها. */
  isFollowing: boolean;
  isFollowedBy: boolean;
  followersCount: number;
  followingCount: number;
  interests: string[];
  /** فقط عکس‌های تأییدشده. */
  photos: string[];
  /** شناسه‌ها هم‌ردیف photos، برای گزارش دقیق همان تصویر. */
  photoIds: number[];
}

/** نتیجه‌ی پیوستن به چتِ تصادفی. */
export interface RandomMatch {
  status: 'waiting' | 'matched';
  matchId?: number;
  peer?: Candidate;
}

export interface RandomFilters {
  gender?: string;
  maxDistanceM?: number;
}
