import type {
  User,
  Photo,
  Candidate,
  MapUser,
  Liker,
  Conversation,
  Message,
  Tier,
  AuthResult,
  MatchResult,
  ProfileDraft,
  Gender,
} from '@/domain/entities';
import type {
  UserDTO,
  PhotoDTO,
  CandidateDTO,
  MapUserDTO,
  LikerDTO,
  ConversationDTO,
  MessageDTO,
  TierDTO,
  AuthDTO,
  MatchDTO,
} from '@/data/dto';

const undefIfNull = <T>(v: T | null | undefined): T | undefined =>
  v === null ? undefined : v;

export const toPhoto = (d: PhotoDTO): Photo => ({
  id: d.id,
  url: d.url,
  isPrimary: d.is_primary,
  status: d.status,
});

export const toUser = (d: UserDTO): User => ({
  id: d.id,
  name: d.name,
  bio: d.bio,
  birthdate: d.birthdate,
  gender: d.gender as Gender | undefined,
  tier: d.tier,
  status: d.status,
  banReason: d.ban_reason,
  verified: d.verified,
  isPlus: d.is_plus,
  hasLocation: d.has_location,
  interests: d.interests,
  photos: d.photos?.map(toPhoto),
});

export const fromProfileDraft = (draft: ProfileDraft) => ({
  name: draft.name,
  bio: draft.bio,
  gender: draft.gender,
  birthdate: draft.birthdate,
  interests: draft.interests,
});

export const toCandidate = (d: CandidateDTO): Candidate => ({
  id: d.id,
  name: d.name ?? 'بی‌نام',
  age: d.age,
  bio: undefIfNull(d.bio),
  distanceM: d.distance_m,
  tier: d.tier,
  photoUrl: undefIfNull(d.photo_url),
  interests: d.interests,
});

export const toMapUser = (d: MapUserDTO): MapUser => ({
  id: d.id,
  name: d.name ?? 'بی‌نام',
  age: d.age,
  photoUrl: undefIfNull(d.photo_url),
  lat: d.lat,
  lng: d.lng,
  distanceM: d.distance_m,
  isMatch: d.is_match ?? false,
  tier: d.tier,
});

export const toLiker = (d: LikerDTO): Liker => ({
  id: d.id,
  name: undefIfNull(d.name),
  age: d.age,
  photoUrl: undefIfNull(d.photo_url),
  tier: d.tier,
});

export const toConversation = (d: ConversationDTO): Conversation => ({
  matchId: d.match_id,
  otherId: d.other_id,
  otherName: d.other_name,
  lastBody: d.last_body,
  lastAt: d.last_at,
  unread: d.unread,
  source: d.source,
});

export const toMessage = (d: MessageDTO): Message => ({
  id: d.id,
  matchId: d.match_id,
  senderId: d.sender_id,
  body: d.body,
  createdAt: d.created_at,
});

export const toTier = (d: TierDTO): Tier => {
  const amountRial = d.price_rial ?? d.amount_rial;
  return {
    id: d.code ?? d.id ?? String(d.level),
    level: d.level,
    name: d.name,
    amountRial,
    priceToman: d.price_toman ?? (amountRial != null ? Math.round(amountRial / 10) : undefined),
  };
};

export const toAuthResult = (d: AuthDTO): AuthResult => ({
  accessToken: d.access_token,
  refreshToken: d.refresh_token,
  profileComplete: Boolean(d.profile_complete),
});

export const toMatchResult = (d: MatchDTO | undefined): MatchResult => ({
  matchId: d?.match_id,
  peer: d?.peer ? toCandidate(d.peer) : undefined,
});
