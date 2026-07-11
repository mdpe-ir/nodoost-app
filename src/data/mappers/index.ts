import type {
  User,
  Photo,
  Candidate,
  MapUser,
  Liker,
  Viewer,
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
  ViewerDTO,
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
  phone: d.phone,
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
    hideOnline: d.prefs?.hide_online ?? false,
    hideDistance: d.prefs?.hide_distance ?? false,
    incognito: d.prefs?.incognito ?? false,
    travelMode: d.prefs?.travel_mode ?? false,
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
        hide_online: draft.prefs.hideOnline,
        hide_distance: draft.prefs.hideDistance,
        incognito: draft.prefs.incognito,
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
  isOnline: d.is_online,
  lastActiveMin: d.last_active_min ?? undefined,
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
  isOnline: d.is_online,
  lastActiveMin: d.last_active_min ?? undefined,
});

export const toLiker = (d: LikerDTO): Liker => ({
  id: d.id,
  name: undefIfNull(d.name),
  age: d.age,
  photoUrl: undefIfNull(d.photo_url),
  tier: d.tier,
});

export const toViewer = (d: ViewerDTO): Viewer => ({
  ...toLiker(d),
  viewedAt: d.viewed_at,
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
  isOnline: d.is_online,
  lastActiveMin: d.last_active_min ?? undefined,
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
  readAt: undefIfNull(d.read_at),
});

export const toTier = (d: TierDTO): Tier => {
  const amountRial = d.price_rial ?? d.amount_rial;
  return {
    id: d.code ?? d.id ?? String(d.level),
    level: d.level,
    name: d.name,
    amountRial,
    priceToman: d.price_toman ?? (amountRial != null ? Math.round(amountRial / 10) : undefined),
    bazaarSku: d.bazaar_sku || undefined,
    days: d.days,
    perks: Array.isArray(d.perks) ? d.perks : [],
    dailySwipeLimit: d.daily_swipe_limit ?? null,
    dailyConversationLimit: d.daily_conversation_limit ?? null,
    dailyRandomLimit: d.daily_random_limit ?? null,
    superLikesPerDay: d.super_likes_per_day ?? 0,
    canSeeLikes: Boolean(d.can_see_likes),
    canFilterRandomGender: Boolean(d.can_filter_random_gender),
    maxRadiusKm: d.max_radius_km ?? 0,
    boostPerMonth: d.boost_per_month ?? 0,
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
