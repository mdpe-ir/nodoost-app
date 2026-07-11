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
  /** شماره‌ی موبایلِ کاربر (فقط در پروفایلِ خودم). */
  phone?: string;
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
  /** پنهان‌کردنِ وضعیتِ آنلاین — فقط با سطحِ طلایی+ اثر می‌کند. */
  hideOnline?: boolean;
  /** پنهان‌کردنِ فاصله — فقط با سطحِ طلایی+ اثر می‌کند. */
  hideDistance?: boolean;
  /** حالتِ ناشناس (حذف از کاوش/اطراف/نقشه) — فقط با الماس اثر می‌کند. */
  incognito?: boolean;
  /** حالتِ سفر فعال است؟ (فقط‌خواندنی؛ با /me/location تغییر می‌کند.) */
  travelMode?: boolean;
}

export interface ProfileDraft {
  name?: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  interests?: string[];
  prefs?: Partial<UserPreferences>;
}
