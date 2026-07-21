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
  FollowState,
  FollowUser,
  AppNotification,
  NotificationActor,
  NotificationKind,
  Badges,
  NotificationPrefs,
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
  FollowStateDTO,
  FollowUserDTO,
  NotificationDTO,
  NotificationActorDTO,
  BadgesDTO,
  NotificationPrefsDTO,
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
  verified: d.verified,
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
  mySwipe: d.my_swipe ?? undefined,
  isOnline: d.is_online,
  lastActiveMin: d.last_active_min ?? undefined,
  isFollowing: Boolean(d.is_following),
  isFollowedBy: Boolean(d.is_followed_by),
  followersCount: d.followers_count ?? 0,
  followingCount: d.following_count ?? 0,
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

// — گرافِ دنبال‌کردن —

export const toFollowState = (d: FollowStateDTO | null | undefined): FollowState => ({
  isFollowing: Boolean(d?.is_following),
  isFollowedBy: Boolean(d?.is_followed_by),
  followersCount: d?.followers_count ?? 0,
  followingCount: d?.following_count ?? 0,
});

export const toFollowUser = (d: FollowUserDTO): FollowUser => ({
  id: d.id,
  name: undefIfNull(d.name),
  age: d.age,
  photoUrl: undefIfNull(d.photo_url),
  tier: d.tier,
  verified: d.verified,
  isFollowing: Boolean(d.is_following),
});

// — اعلان‌ها —

const NOTIFICATION_KINDS: readonly NotificationKind[] = [
  'follow',
  'like',
  'super_like',
  'match',
  'message',
  'profile_view',
  'system',
];

/** گونه‌ی ناشناخته‌ی سرور را به «system» می‌بریم تا اپ نشکند. */
const toNotificationKind = (raw: string): NotificationKind =>
  (NOTIFICATION_KINDS as readonly string[]).includes(raw) ? (raw as NotificationKind) : 'system';

export const toNotificationActor = (d: NotificationActorDTO): NotificationActor => ({
  id: d.id,
  name: undefIfNull(d.name),
  photoUrl: undefIfNull(d.photo_url),
  tier: d.tier,
});

export const toNotification = (d: NotificationDTO): AppNotification => ({
  id: d.id,
  kind: toNotificationKind(d.kind),
  // متنِ نمایشی همیشه از سرور می‌آید؛ این‌جا چیزی ساخته نمی‌شود.
  title: d.title ?? '',
  body: d.body ?? '',
  actors: (d.actors ?? []).map(toNotificationActor),
  count: d.count ?? 1,
  locked: Boolean(d.locked),
  entityId: d.entity_id ?? undefined,
  linkUrl: undefIfNull(d.link_url),
  seen: Boolean(d.seen),
  read: Boolean(d.read),
  createdAt: d.created_at,
  updatedAt: d.updated_at ?? d.created_at,
});

export const toBadges = (d: BadgesDTO | null | undefined): Badges => ({
  notifications: d?.notifications ?? 0,
  unreadNotifications: d?.unread_notifications ?? 0,
  unreadMessages: d?.unread_messages ?? 0,
  unreadThreads: d?.unread_threads ?? 0,
});

export const toNotificationPrefs = (d: NotificationPrefsDTO | null | undefined): NotificationPrefs => ({
  follows: d?.notif_follows ?? true,
  likes: d?.notif_likes ?? true,
  messages: d?.notif_messages ?? true,
  matches: d?.notif_matches ?? true,
  profileViews: d?.notif_profile_views ?? true,
  system: d?.notif_system ?? true,
});

/** فقط کلیدهای داده‌شده را می‌فرستد (بدنه‌ی PUT جزئی است). */
export const fromNotificationPrefs = (p: Partial<NotificationPrefs>): NotificationPrefsDTO => {
  const dto: NotificationPrefsDTO = {};
  if (p.follows !== undefined) dto.notif_follows = p.follows;
  if (p.likes !== undefined) dto.notif_likes = p.likes;
  if (p.messages !== undefined) dto.notif_messages = p.messages;
  if (p.matches !== undefined) dto.notif_matches = p.matches;
  if (p.profileViews !== undefined) dto.notif_profile_views = p.profileViews;
  if (p.system !== undefined) dto.notif_system = p.system;
  return dto;
};
