/** شکل‌های خامِ پاسخِ API (snake_case). دامنه از این‌ها بی‌خبر است. */

export interface PhotoDTO {
  id: number;
  url: string;
  is_primary?: boolean;
  status?: string;
}

export interface UserDTO {
  id: number;
  name?: string;
  bio?: string;
  birthdate?: string;
  gender?: string;
  tier: number;
  status: 'active' | 'banned' | 'pending_review';
  ban_reason?: string;
  is_plus?: boolean;
  verified?: boolean;
  interests?: string[];
  photos?: PhotoDTO[];
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
}

export interface LikerDTO {
  id: number;
  name?: string | null;
  age?: number;
  photo_url?: string | null;
  tier?: number;
}

export interface ConversationDTO {
  match_id: number;
  other_id: number;
  other_name?: string;
  last_body?: string;
  last_at?: string;
  unread?: number;
  source?: 'swipe' | 'random';
}

export interface MessageDTO {
  id?: number;
  match_id: number;
  sender_id: number;
  body: string;
  created_at?: string;
}

export interface TierDTO {
  id?: string;
  code?: string;
  level: number;
  name: string;
  price_toman?: number;
  amount_rial?: number;
  price_rial?: number;
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
