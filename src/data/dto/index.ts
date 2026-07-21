/** شکل‌های خامِ پاسخِ API (snake_case). دامنه از این‌ها بی‌خبر است. */

export interface PhotoDTO {
  id: number;
  url: string;
  is_primary?: boolean;
  status?: string;
  rejection_reason?: string | null;
}

export interface UserDTO {
  id: number;
  phone?: string;
  name?: string;
  bio?: string;
  birthdate?: string;
  gender?: string;
  tier: number;
  status: 'active' | 'banned' | 'pending_review';
  ban_reason?: string;
  is_plus?: boolean;
  subscription_until?: string | null;
  subscription_plan?: string | null;
  subscription_provider?: string | null;
  subscription_status?: string | null;
  verified?: boolean;
  has_location?: boolean;
  interests?: string[];
  photos?: PhotoDTO[];
  prefs?: {
    show_on_map?: boolean;
    show_exact_location_on_map?: boolean;
    hide_online?: boolean;
    hide_distance?: boolean;
    incognito?: boolean;
    travel_mode?: boolean;
    [key: string]: unknown;
  };
}

export interface CandidateDTO {
  id: number;
  name: string | null;
  age?: number;
  bio?: string | null;
  distance_m?: number;
  tier?: number;
  photo_url?: string | null;
  interests?: string[];
  /** فقط برای بیننده‌ی نقره‌ای+ و اگر طرف پنهانش نکرده باشد. */
  is_online?: boolean;
  last_active_min?: number | null;
}

export interface PeerProfileDTO {
  id: number;
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  bio?: string | null;
  verified?: boolean;
  tier?: number;
  distance_m?: number | null;
  is_match?: boolean;
  match_id?: number | null;
  /** کنشِ خودم روی این کاربر؛ اگر هنوز کنشی نکرده‌ام null. */
  my_swipe?: 'like' | 'super' | 'nope' | null;
  /** فقط برای بیننده‌ی نقره‌ای+ و اگر طرف پنهانش نکرده باشد. */
  is_online?: boolean;
  last_active_min?: number | null;
  /** گرافِ دنبال‌کردن — رایگان، بدونِ وابستگی به سطح. */
  is_following?: boolean;
  is_followed_by?: boolean;
  followers_count?: number;
  following_count?: number;
  interests?: string[];
  photos?: string[];
  photo_ids?: number[];
}

/** پاسخِ مشترکِ ‎POST/DELETE /api/users/{id}/follow‎. */
export interface FollowStateDTO {
  ok?: boolean;
  is_following?: boolean;
  is_followed_by?: boolean;
  followers_count?: number;
  following_count?: number;
}

/** یک سطر در فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌ها. */
export interface FollowUserDTO {
  id: number;
  name?: string | null;
  age?: number;
  photo_url?: string | null;
  tier?: number;
  verified?: boolean;
  is_following?: boolean;
}

export interface NotificationActorDTO {
  id: number;
  name?: string | null;
  photo_url?: string | null;
  tier?: number;
}

/** یک اعلان؛ `title`/`body` متنِ فارسیِ آماده‌ی سرور است. */
export interface NotificationDTO {
  id: number;
  kind: string;
  title?: string | null;
  body?: string | null;
  actors?: NotificationActorDTO[] | null;
  count?: number;
  locked?: boolean;
  entity_id?: number | null;
  link_url?: string | null;
  seen?: boolean;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** پاسخِ ‎GET /api/me/badges‎. */
export interface BadgesDTO {
  notifications?: number;
  unread_notifications?: number;
  unread_messages?: number;
  unread_threads?: number;
}

/** پاسخ/بدنه‌ی ‎/api/me/notification-prefs‎. */
export interface NotificationPrefsDTO {
  notif_follows?: boolean;
  notif_likes?: boolean;
  notif_messages?: boolean;
  notif_matches?: boolean;
  notif_profile_views?: boolean;
  notif_system?: boolean;
}

/** شکلِ عمومیِ پاسخِ صفحه‌بندی‌شده‌ی بک‌اند. */
export interface PagedDTO<T> {
  results?: T[] | null;
  page?: number;
  limit?: number;
  total?: number;
  has_more?: boolean;
}

export interface LikerDTO {
  id: number;
  name?: string | null;
  age?: number;
  photo_url?: string | null;
  tier?: number;
}

/** بازدیدکننده‌ی پروفایل — همان liker به‌علاوه‌ی زمانِ بازدید. */
export interface ViewerDTO extends LikerDTO {
  viewed_at?: string;
}

export interface MapUserDTO {
  id: number;
  name: string | null;
  age?: number;
  photo_url?: string | null;
  lat: number;
  lng: number;
  distance_m?: number;
  is_match?: boolean;
  verified?: boolean;
  tier?: number;
  /** فقط برای بیننده‌ی نقره‌ای+ و اگر طرف پنهانش نکرده باشد. */
  is_online?: boolean;
  last_active_min?: number | null;
}

/** پاسخِ ‎/api/map/nearby‎ — نشانگرها + متادیتای شعاعِ سطحِ کاربر. */
export interface MapNearbyDTO {
  results: MapUserDTO[];
  /** سقفِ شعاعِ سطحِ کاربر (کیلومتر). */
  max_radius_km?: number;
  /** شعاعِ اعمال‌شده (متر). */
  radius_m?: number;
}

export interface ConversationDTO {
  match_id: number;
  other_id: number;
  other_name?: string;
  other_photo_url?: string | null;
  other_tier?: number;
  last_body?: string;
  last_at?: string;
  unread?: number;
  source?: 'swipe' | 'random';
  initiated_by?: number | null;
}

export interface MessageDTO {
  id?: number;
  match_id: number;
  sender_id: number;
  body: string;
  created_at?: string;
  /** رسیدِ خواندن — فقط روی پیام‌های خودم و از سطحِ طلایی برمی‌گردد. */
  read_at?: string | null;
}

export interface TierDTO {
  id?: string;
  code?: string;
  bazaar_sku?: string;
  level: number;
  name: string;
  price_toman?: number;
  amount_rial?: number;
  price_rial?: number;
  days?: number;
  perks?: string[] | null;
  daily_swipe_limit?: number | null;
  daily_conversation_limit?: number | null;
  daily_random_limit?: number | null;
  super_likes_per_day?: number;
  can_see_likes?: boolean;
  can_filter_random_gender?: boolean;
  max_radius_km?: number;
  boost_per_month?: number;
}

export interface AuthDTO {
  access_token: string;
  refresh_token?: string;
  profile_complete?: boolean;
}

export interface MatchDTO {
  match_id?: number;
  peer?: CandidateDTO;
}
