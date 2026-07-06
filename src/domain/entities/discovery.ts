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
}

/** یک نشانگرِ کاربر روی نقشه (مختصات همیشه فازی‌شده). */
export interface MapUser {
  id: number;
  name: string;
  age?: number;
  photoUrl?: string;
  lat: number;
  lng: number;
  distanceM?: number;
  isMatch?: boolean;
  tier?: number;
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

/** پاسخِ بخشِ پسندها (تعداد + آشکار/قفل + فهرست). */
export interface LikesOverview {
  count: number;
  revealed: boolean;
  likers: Liker[];
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
