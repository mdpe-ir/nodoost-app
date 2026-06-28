export type Gender = 'f' | 'm' | 'x';
export type AccountStatus = 'active' | 'banned' | 'pending_review';

export interface Photo {
  id: number;
  url: string;
  isPrimary?: boolean;
  status?: string;
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
  interests?: string[];
  photos?: Photo[];
}

export interface ProfileDraft {
  name?: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  interests?: string[];
}
