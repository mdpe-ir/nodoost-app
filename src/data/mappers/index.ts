import type {
  User,
  Photo,
  Candidate,
  MapUser,
  Liker,
  PeerProfile,
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
  PeerProfileDTO,
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
  rejectionReason: undefIfNull(d.rejection_reason),
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
  subscriptionUntil: undefIfNull(d.subscription_until),
  subscriptionPlan: undefIfNull(d.subscription_plan),
  subscriptionProvider: undefIfNull(d.subscription_provider),
  subscriptionStatus: undefIfNull(d.subscription_status),
  hasLocation: d.has_location,
  interests: d.interests,
  photos: d.photos?.map(toPhoto),
  prefs: {
    showOnMap: d.prefs?.show_on_map ?? true,
    showExactLocationOnMap: d.prefs?.show_exact_location_on_map ?? false,
  },
});

export const fromProfileDraft = (draft: ProfileDraft) => ({
  name: draft.name,
  bio: draft.bio,
  gender: draft.gender,
  birthdate: draft.birthdate,
  interests: draft.interests,
  prefs: draft.prefs
    ? {
        show_on_map: draft.prefs.showOnMap,
        show_exact_location_on_map: draft.prefs.showExactLocationOnMap,
      }
    : undefined,
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

export const toPeerProfile = (d: PeerProfileDTO): PeerProfile => ({
  id: d.id,
  name: undefIfNull(d.name),
  age: d.age ?? undefined,
  gender: undefIfNull(d.gender),
  bio: undefIfNull(d.bio),
  verified: d.verified,
  tier: d.tier,
  distanceM: d.distance_m ?? undefined,
  isMatch: d.is_match ?? false,
  matchId: d.match_id ?? undefined,
  interests: d.interests ?? [],
  photos: d.photos ?? [],
  photoIds: d.photo_ids ?? [],
});

export const toConversation = (d: ConversationDTO): Conversation => ({
  matchId: d.match_id,
  otherId: d.other_id,
  otherName: d.other_name,
  otherPhotoUrl: undefIfNull(d.other_photo_url),
  otherTier: d.other_tier,
  lastBody: d.last_body,
  lastAt: d.last_at,
  unread: d.unread,
  source: d.source,
  initiatedBy: d.initiated_by,
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
