import type {
  AppNotification,
  AuthResult,
  Badges,
  BlockedUser,
  Candidate,
  Conversation,
  FollowState,
  FollowUser,
  Gender,
  InAppMessage,
  Liker,
  MapUser,
  MatchResult,
  Message,
  NotificationActor,
  NotificationKind,
  NotificationPrefs,
  PeerProfile,
  Photo,
  Rank,
  ProfileDraft,
  PurchaseResult,
  QueuedSubscription,
  SupportOverview,
  Tier,
  User,
  Viewer,
} from '@/domain/entities';
import type {
  AuthDTO,
  BadgesDTO,
  BlockedUserDTO,
  CandidateDTO,
  ConversationDTO,
  FollowStateDTO,
  FollowUserDTO,
  InAppMessageDTO,
  LikerDTO,
  MapUserDTO,
  MatchDTO,
  MessageDTO,
  NotificationActorDTO,
  NotificationDTO,
  NotificationPrefsDTO,
  PeerProfileDTO,
  PhotoDTO,
  PurchaseResultDTO,
  RankDTO,
  SubscriptionSegmentDTO,
  SupportOverviewDTO,
  TierDTO,
  UserDTO,
  ViewerDTO,
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
  subscriptionQueue: (d.subscription_queue ?? []).map(toQueuedSubscription),
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
  points: d.points
    ? {
        balance: d.points.balance ?? 0,
        earned: d.points.earned ?? 0,
        rankLevel: d.points.rank_level ?? 0,
        rank: toRank(d.points.rank),
        nextRank: toRank(d.points.next_rank),
        toNext: d.points.to_next ?? 0,
      }
    : undefined,
});

/** پلهٔ رتبه — سرورِ قدیمی این را نمی‌فرستد، پس undefined هم معتبر است. */
const toRank = (r?: RankDTO | null): Rank | undefined =>
  r ? { level: r.level, name: r.name, minPoints: r.min_points, color: r.color, icon: r.icon } : undefined;

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
  rank: d.rank
    ? {
        level: d.rank.level,
        name: d.rank.name,
        minPoints: d.rank.min_points,
        color: d.rank.color,
        icon: d.rank.icon,
      }
    : undefined,
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
  isSupport: d.is_support ?? false,
  verified: d.verified ?? false,
});

export const toSupportOverview = (d: SupportOverviewDTO): SupportOverview => ({
  // بدونِ حسابِ رسمی، پشتیبانی عملاً خاموش است — اپ باید ورودی را پنهان کند.
  enabled: Boolean(d?.enabled) && Boolean(d?.account),
  account: d?.account
    ? {
        userId: d.account.user_id,
        name: undefIfNull(d.account.name),
        photoUrl: undefIfNull(d.account.photo_url),
        verified: d.account.verified ?? false,
      }
    : undefined,
  topics: d?.topics ?? [],
  welcomeMessage: d?.welcome_message ?? '',
  matchId: undefIfNull(d?.match_id),
  topic: undefIfNull(d?.topic),
  status: undefIfNull(d?.status),
  unread: d?.unread ?? 0,
});

export const toMessage = (d: MessageDTO): Message => ({
  id: d.id,
  matchId: d.match_id,
  senderId: d.sender_id,
  body: d.body,
  createdAt: d.created_at,
  readAt: undefIfNull(d.read_at),
  editedAt: undefIfNull(d.edited_at),
  replyTo: d.reply_to
    ? {
        id: d.reply_to.id,
        senderId: d.reply_to.sender_id,
        body: d.reply_to.body ?? '',
        deleted: Boolean(d.reply_to.deleted),
      }
    : undefined,
  deleted: Boolean(d.deleted),
  deletedByAdmin: Boolean(d.deleted_by_admin),
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
    // نبودِ فیلد یعنی بک‌اند قدیمی است یا کاربر لاگین نیست — در هر دو حالت قفل نکن.
    purchasable: d.purchasable !== false,
    blockReason: d.block_reason || undefined,
    blockMessage: d.block_message || undefined,
    queuedDaysLeft: d.days_left,
  };
};

export const toQueuedSubscription = (d: SubscriptionSegmentDTO): QueuedSubscription => ({
  tierLevel: d.tier_level,
  daysRemaining: d.days_remaining ?? 0,
  startsAt: d.starts_at,
  endsAt: d.ends_at,
});

export const toPurchaseResult = (d: PurchaseResultDTO | undefined): PurchaseResult => ({
  outcome: d?.outcome as PurchaseResult['outcome'],
  tier: d?.tier,
  subscriptionUntil: undefIfNull(d?.subscription_until),
  grantedUntil: undefIfNull(d?.granted_until),
  deferred: (d?.deferred ?? []).map(toQueuedSubscription),
  already: d?.already === true,
});

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

export const toBlockedUser = (d: BlockedUserDTO): BlockedUser => ({
  id: d.id,
  name: undefIfNull(d.name),
  photoUrl: undefIfNull(d.photo_url),
  verified: d.verified,
  blockedAt: d.blocked_at,
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

const IN_APP_SURFACES = ['banner', 'popup', 'alarm'] as const;
const IN_APP_ACCENTS = ['gold', 'info', 'success', 'warn', 'danger'] as const;
const IN_APP_POLICIES = [
  'once',
  'once_per_session',
  'once_per_day',
  'max_count',
  'always',
] as const;

/**
 * پیامِ درون‌برنامه‌ای. هر مقدارِ ناشناخته به امن‌ترین حالت می‌افتد: سطحِ نامعلوم
 * «بنر» می‌شود (کم‌آزارترین) و سیاستِ نامعلوم «یک بار» — تا نسخه‌ی قدیمی‌ترِ اپ
 * با پیامِ نوعِ تازه، پاپ‌آپِ بی‌پایان نسازد.
 */
export const toInAppMessage = (d: InAppMessageDTO): InAppMessage => ({
  id: d.id,
  surface: (IN_APP_SURFACES as readonly string[]).includes(d.surface ?? '')
    ? (d.surface as InAppMessage['surface'])
    : 'banner',
  title: d.title ?? '',
  body: d.body ?? '',
  fullBody: d.full_body?.trim() ? d.full_body : (d.body ?? ''),
  imageUrl: undefIfNull(d.image_url) || undefined,
  icon: undefIfNull(d.icon) || undefined,
  accent: (IN_APP_ACCENTS as readonly string[]).includes(d.accent ?? '')
    ? (d.accent as InAppMessage['accent'])
    : 'gold',
  ctaLabel: undefIfNull(d.cta_label) || undefined,
  ctaUrl: undefIfNull(d.cta_url) || undefined,
  secondaryLabel: undefIfNull(d.secondary_label) || undefined,
  secondaryUrl: undefIfNull(d.secondary_url) || undefined,
  dismissible: d.dismissible !== false,
  policy: (IN_APP_POLICIES as readonly string[]).includes(d.display_policy ?? '')
    ? (d.display_policy as InAppMessage['policy'])
    : 'once',
  maxImpressions: d.max_impressions ?? 1,
  cooldownMinutes: d.cooldown_minutes ?? 0,
  scope: d.persist_scope === 'client' ? 'client' : 'server',
  priority: d.priority ?? 0,
  impressions: d.impressions ?? 0,
  lastSeenAt: undefIfNull(d.last_seen_at),
});
