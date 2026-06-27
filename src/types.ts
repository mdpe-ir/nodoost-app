export type AccountStatus = 'active' | 'banned' | 'pending_review';

export interface Me {
  id: number;
  name?: string;
  bio?: string;
  birthdate?: string;
  gender?: string;
  tier: number;
  status: AccountStatus;
  ban_reason?: string;
  is_plus?: boolean;
  verified?: boolean;
  interests?: string[];
  photos?: Photo[];
}

export interface Photo {
  id: number;
  url: string;
  is_primary?: boolean;
}

export interface Candidate {
  id: number;
  name: string;
  age?: number;
  bio?: string;
  distance_m?: number;
  tier?: number;
  photos?: string[];
  interests?: string[];
}

export interface Conversation {
  match_id: number;
  other_id: number;
  other_name?: string;
  last_body?: string;
  last_at?: string;
  unread?: number;
  source?: 'swipe' | 'random';
}

export interface Message {
  id?: number;
  match_id: number;
  sender_id: number;
  body: string;
  created_at?: string;
}

export interface TierPlan {
  id: string;
  level: number;
  name: string;
  price_toman?: number;
  amount_rial?: number;
}
