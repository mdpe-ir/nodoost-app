/**
 * امتیاز، ماموریت، جایزه، دعوت و رتبه.
 *
 * دو شمارنده داریم نه یکی: `balance` خرج‌شدنی است و `earned` مبنای رتبه و هرگز
 * با گرفتنِ جایزه کم نمی‌شود. اپ هیچ‌کدام را خودش حساب نمی‌کند؛ سرور منبعِ
 * حقیقت است و این‌جا فقط روایتش می‌شود.
 */

export type MissionVerifyKind = 'auto' | 'honor' | 'callback' | 'manual';

export type MissionRepeatMode = 'once' | 'daily' | 'weekly' | 'limited' | 'unlimited';

export type MissionState =
  | 'in_progress'
  | 'pending_review'
  | 'claimable'
  | 'completed'
  | 'rejected';

/** دلیلِ قفل‌بودنِ ماموریت — کارت را خاکستری می‌کند ولی پنهانش نمی‌کند. */
export type MissionLockReason = 'tier' | 'profile';

/** چه مدرکی برای ماموریتِ دستی لازم است. */
export type MissionProofKind = 'none' | 'text' | 'image' | 'image_and_text';

/** یک مرحله از «چطور انجامش بدهم». نمایشی است؛ href آن را قابلِ زدن می‌کند. */
export interface MissionStep {
  title: string;
  body?: string;
  /** مسیرِ داخلیِ اپ (مثل /photos) یا نشانیِ وب. */
  href?: string;
}

/** یک عکسِ مدرکِ ارسال‌شده. نشانی امضاشده و منقضی‌شونده است. */
export interface MissionProof {
  id: number;
  url: string;
  createdAt: string;
}

export interface Mission {
  id: number;
  code: string;
  title: string;
  /** یک‌خطی برای کارتِ فهرست. */
  summary: string;
  /** متنِ بلندِ صفحه‌ی جزئیات — در پاسخِ فهرست خالی است. */
  description: string;
  badgeUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  verifyKind: MissionVerifyKind;
  threshold: number;
  honorDelaySec: number;
  repeatMode: MissionRepeatMode;
  points: number;
  minTier: number;
  state: MissionState;
  progress: number;
  completedCount: number;
  /** honor: از چه لحظه‌ای دکمه‌ی «بررسی» فعال می‌شود (ISO). */
  readyAt?: string;
  startedAt?: string;
  /** سرور می‌گوید دکمه‌ی دریافت باید فعال باشد یا نه — اپ خودش تصمیم نمی‌گیرد. */
  claimable: boolean;
  locked: boolean;
  lockReason?: MissionLockReason;

  /** مراحل و قوانین فقط در پاسخِ جزئیات می‌آیند. */
  steps: MissionStep[];
  rules: string[];

  proofKind: MissionProofKind;
  proofLabel?: string;
  proofMinImages: number;
  proofMaxImages: number;
  /** عکس‌های همین دوره — فقط در پاسخِ جزئیات. */
  proofs: MissionProof[];
  /** متنِ مدرکی که قبلاً فرستاده شده. */
  proof?: string;
  /** دلیلِ ردِ ادمین. کاربر باید بداند چه چیزی را درست کند. */
  reviewNote?: string;
  attempt: number;
  attemptsLeft: number;
  /** مهلتِ اعلام‌شده‌ی بازبینی، برای متنِ «معمولاً تا ۲۴ ساعت». */
  reviewSlaHours: number;
}

export interface Rank {
  level: number;
  name: string;
  minPoints: number;
  color?: string;
  icon?: string;
}

export interface PointsState {
  /** موجودیِ خرج‌شدنی. */
  balance: number;
  /** امتیازِ کسب‌شده در طولِ عمر — مبنای رتبه. */
  earned: number;
  rankLevel: number;
  rank?: Rank;
  nextRank?: Rank;
  /** امتیازِ لازم تا رتبه‌ی بعدی؛ ۰ یعنی رتبه‌ی بعدی وجود ندارد. */
  toNext: number;
}

export interface PointEntry {
  id: number;
  delta: number;
  reason: string;
  /** عنوانِ آمادهٔ نمایش — سرور می‌سازد تا اپ منطقِ ترجمه نداشته باشد. */
  title: string;
  createdAt: string;
}

/** کارتِ ساختگیِ «دعوت از دوستان» در فهرستِ ماموریت‌ها. */
export interface ReferralCard {
  title: string;
  description: string;
  points: number;
  ctaLabel: string;
  ctaUrl: string;
}

export interface MissionsOverview {
  enabled: boolean;
  missions: Mission[];
  points: PointsState;
  referralCard?: ReferralCard;
}

export type RewardKind = 'subscription' | 'manual';

/** چرا این جایزه همین حالا قابلِ گرفتن نیست. */
export type RewardBlockReason =
  | 'points'
  | 'rank'
  | 'stock'
  | 'limit'
  | 'tier_cap'
  | 'monthly_cap';

export interface Reward {
  id: number;
  code: string;
  title: string;
  description: string;
  imageUrl?: string;
  kind: RewardKind;
  cost: number;
  tierLevel?: number;
  days?: number;
  inputLabel?: string;
  inputRequired: boolean;
  /** null/undefined یعنی نامحدود. */
  stockLeft?: number;
  perUserLimit?: number;
  myCount: number;
  affordable: boolean;
  redeemable: boolean;
  reason?: RewardBlockReason;
  /**
   * سطحِ این جایزه از اشتراکِ فعالِ کاربر پایین‌تر است، پس صفِ استحقاق آن را
   * پشتِ اشتراکِ فعلی می‌نشاند. باید گفته شود وگرنه کاربر فکر می‌کند جایزه‌اش گم شده.
   */
  queueNotice: boolean;
}

export interface RewardSubCap {
  monthlyDays: number;
  usedDays: number;
  remainingDays: number;
  maxTier: number;
}

export interface RewardsOverview {
  rewards: Reward[];
  points: PointsState;
  subCap: RewardSubCap;
}

export type RedemptionStatus = 'pending' | 'fulfilled' | 'rejected' | 'cancelled';

export interface Redemption {
  id: number;
  rewardTitle: string;
  rewardKind: RewardKind;
  cost: number;
  status: RedemptionStatus;
  grantedDays: number;
  grantedTier?: number;
  userInput?: string;
  adminNote?: string;
  queued: boolean;
  createdAt: string;
}

export interface RedeemResult {
  redemption: Redemption;
  points: PointsState;
  /** activated | renewed | upgraded | queued — فقط برای جایزه‌ی اشتراک. */
  outcome?: string;
  activeUntil?: string;
}

export type ReferralStatus = 'pending' | 'qualified' | 'rejected' | 'reversed';

export interface Invitee {
  id: number;
  userId: number;
  name: string;
  photoUrl?: string;
  status: ReferralStatus;
  inviterPoints: number;
  createdAt: string;
  qualifiedAt?: string;
}

export interface ReferralSummary {
  code: string;
  total: number;
  qualified: number;
  pending: number;
  pointsEarned: number;
  /** جایزه‌ی هر دعوتِ موفق. */
  inviterPoints: number;
  /** هدیه‌ی خوش‌آمدِ کسی که با کد می‌آید. */
  inviteePoints: number;
  qualifyRule: string;
  graceDays: number;
  /** خودِ کاربر هنوز می‌تواند کدِ کسِ دیگری را وارد کند. */
  canEnterCode: boolean;
  enabled: boolean;
}

export interface ReferralOverview {
  summary: ReferralSummary;
  invitees: Invitee[];
  total: number;
}

// ── رتبه‌بندیِ دوره‌ای ────────────────────────────────────────────────────────

/** بازه‌های جدولِ رتبه‌بندی. تقویمی‌اند (به وقتِ تهران و تقویمِ شمسی)، نه غلتان. */
export type LeaderWindow = 'daily' | 'weekly' | 'monthly' | 'all';

export interface LeaderEntry {
  rank: number;
  userId: number;
  name: string;
  photoUrl?: string;
  points: number;
  isMe: boolean;
}

/** جایگاهِ خودِ کاربر — جدا از فهرست، چون معمولاً در صدرِ جدول نیست. */
export interface MyStanding {
  /** ۰ یعنی در این بازه امتیازی نگرفته و اصلاً رتبه‌ای ندارد. */
  rank: number;
  points: number;
  /** در همان فهرستی که نشان داده می‌شود هست یا نه. */
  inTop: boolean;
}

export interface Leaderboard {
  window: LeaderWindow;
  /** عنوانِ فارسیِ بازه — «این هفته»، «مرداد»… */
  label: string;
  entries: LeaderEntry[];
  me: MyStanding;
  total: number;
  /** لحظه‌ی صفر شدنِ بازه (ISO)؛ برای بازه‌ی کلی وجود ندارد. */
  resetsAt?: string;
}

/** رتبه از روی امتیازِ طولِ عمر — برای وقتی که فقط کاتالوگ در دست است. */
export const rankFor = (catalog: Rank[], earned: number): Rank | undefined => {
  let current: Rank | undefined;
  for (const r of catalog) {
    if (r.minPoints <= earned) current = r;
    else break;
  }
  return current;
};
