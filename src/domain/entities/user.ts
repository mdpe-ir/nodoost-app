export type Gender = 'f' | 'm' | 'x';
export type AccountStatus = 'active' | 'banned' | 'pending_review';

export interface Photo {
  id: number;
  url: string;
  isPrimary?: boolean;
  status?: string;
  rejectionReason?: string;
}

/** کاربرِ جاری (پروفایلِ خودم). */
export interface User {
  id: number;
  name?: string;
  bio?: string;
  birthdate?: string;
  gender?: Gender;
  tier: number;
  status: AccountStatus;
  banReason?: string;
  verified?: boolean;
  isPlus?: boolean;
  subscriptionUntil?: string;
  subscriptionPlan?: string;
  subscriptionProvider?: string;
  subscriptionStatus?: string;
  /** موقعیت ست شده؟ بدونِ آن، کاربر در کاوشِ دیگران دیده نمی‌شود. */
  hasLocation?: boolean;
  interests?: string[];
  photos?: Photo[];
  prefs?: UserPreferences;
}

export interface UserPreferences {
  /** حضور روی نقشه؛ پیش‌فرض روشن است. */
  showOnMap: boolean;
  /** نمایش نقطه‌ی دقیق؛ پیش‌فرض خاموش است. */
  showExactLocationOnMap: boolean;
}

export interface ProfileDraft {
  name?: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  interests?: string[];
  prefs?: Partial<UserPreferences>;
}
