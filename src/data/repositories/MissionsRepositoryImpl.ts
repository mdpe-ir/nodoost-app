import type { MissionsRepository } from '@/domain/repositories/MissionsRepository';
import type {
  Invitee,
  Mission,
  Leaderboard,
  LeaderEntry,
  LeaderWindow,
  MissionLockReason,
  MissionProof,
  MissionProofKind,
  MissionRepeatMode,
  MissionState,
  MissionStep,
  MissionVerifyKind,
  MissionsOverview,
  PointEntry,
  PointsState,
  Rank,
  RedeemResult,
  Redemption,
  RedemptionStatus,
  ReferralOverview,
  ReferralStatus,
  Reward,
  RewardBlockReason,
  RewardKind,
  RewardsOverview,
} from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import { mediaUrl } from '@/core/http/mediaUrl';

interface RankDTO {
  level: number;
  name: string;
  min_points: number;
  color?: string;
  icon?: string;
}

interface PointsDTO {
  balance?: number;
  earned?: number;
  rank_level?: number;
  rank?: RankDTO | null;
  next_rank?: RankDTO | null;
  to_next?: number;
}

interface MissionStepDTO {
  title?: string;
  body?: string;
  href?: string;
}

interface MissionProofDTO {
  id: number;
  url: string;
  created_at: string;
}

interface MissionDTO {
  id: number;
  code: string;
  title: string;
  summary?: string;
  description?: string;
  badge_url?: string;
  steps?: MissionStepDTO[] | null;
  rules?: string[] | null;
  cta_label?: string;
  cta_url?: string;
  verify_kind: string;
  threshold?: number;
  honor_delay_sec?: number;
  repeat_mode: string;
  points: number;
  min_tier?: number;
  state?: string;
  progress?: number;
  completed_count?: number;
  ready_at?: string | null;
  started_at?: string | null;
  claimable?: boolean;
  locked?: boolean;
  lock_reason?: string;
  proof_kind?: string;
  proof_label?: string;
  proof_min_images?: number;
  proof_max_images?: number;
  proofs?: MissionProofDTO[] | null;
  proof?: string;
  review_note?: string;
  attempt?: number;
  attempts_left?: number;
  review_sla_hours?: number;
}

interface RewardDTO {
  id: number;
  code: string;
  title: string;
  description?: string;
  image_url?: string;
  kind: string;
  cost: number;
  tier_level?: number | null;
  days?: number | null;
  input_label?: string;
  input_required?: boolean;
  stock_left?: number | null;
  per_user_limit?: number | null;
  my_count?: number;
  affordable?: boolean;
  redeemable?: boolean;
  reason?: string;
  queue_notice?: boolean;
}

interface RedemptionDTO {
  id: number;
  reward_title?: string;
  reward_kind?: string;
  cost: number;
  status: string;
  granted_days?: number;
  granted_tier?: number | null;
  user_input?: string;
  admin_note?: string;
  queued?: boolean;
  created_at: string;
}

interface RefRowDTO {
  id: number;
  invitee_id: number;
  invitee_name?: string;
  invitee_photo?: string;
  status: string;
  inviter_points?: number;
  created_at: string;
  qualified_at?: string | null;
}

const toRank = (d?: RankDTO | null): Rank | undefined =>
  d ? { level: d.level, name: d.name, minPoints: d.min_points, color: d.color, icon: d.icon } : undefined;

const toPoints = (d?: PointsDTO | null): PointsState => ({
  balance: d?.balance ?? 0,
  earned: d?.earned ?? 0,
  rankLevel: d?.rank_level ?? 0,
  rank: toRank(d?.rank),
  nextRank: toRank(d?.next_rank),
  toNext: d?.to_next ?? 0,
});

// مرحله‌ی بی‌عنوان در سرور حذف می‌شود، ولی اپ هم دفاع می‌کند: پاسخِ کهنه از
// نسخه‌ی قدیمیِ سرور نباید ردیفِ خالی رندر کند.
const toStep = (d: MissionStepDTO): MissionStep => ({
  title: d.title ?? '',
  body: d.body || undefined,
  href: d.href || undefined,
});

const toProof = (d: MissionProofDTO): MissionProof => ({
  id: d.id,
  url: mediaUrl(d.url) ?? d.url,
  createdAt: d.created_at,
});

interface LeaderEntryDTO {
  rank: number;
  user_id: number;
  name?: string;
  photo_url?: string;
  points: number;
  is_me?: boolean;
}

interface LeaderboardDTO {
  window: string;
  label?: string;
  entries?: LeaderEntryDTO[] | null;
  me?: { rank?: number; points?: number; in_top?: boolean };
  total?: number;
  resets_at?: string | null;
}

const toLeaderEntry = (d: LeaderEntryDTO): LeaderEntry => ({
  rank: d.rank,
  userId: d.user_id,
  name: d.name || '',
  photoUrl: d.photo_url ? mediaUrl(d.photo_url) : undefined,
  points: d.points,
  isMe: Boolean(d.is_me),
});

const toMission = (d: MissionDTO): Mission => ({
  id: d.id,
  code: d.code,
  title: d.title,
  summary: d.summary ?? d.description ?? '',
  description: d.description ?? '',
  badgeUrl: d.badge_url ? mediaUrl(d.badge_url) : undefined,
  steps: (d.steps ?? []).map(toStep).filter((s) => s.title !== ''),
  rules: (d.rules ?? []).filter((r) => typeof r === 'string' && r.trim() !== ''),
  proofKind: (d.proof_kind ?? 'none') as MissionProofKind,
  proofLabel: d.proof_label || undefined,
  proofMinImages: d.proof_min_images ?? 0,
  proofMaxImages: d.proof_max_images ?? 0,
  proofs: (d.proofs ?? []).map(toProof),
  proof: d.proof || undefined,
  reviewNote: d.review_note || undefined,
  attempt: d.attempt ?? 0,
  attemptsLeft: d.attempts_left ?? 0,
  reviewSlaHours: d.review_sla_hours ?? 24,
  ctaLabel: d.cta_label || undefined,
  ctaUrl: d.cta_url || undefined,
  verifyKind: d.verify_kind as MissionVerifyKind,
  threshold: Math.max(1, d.threshold ?? 1),
  honorDelaySec: d.honor_delay_sec ?? 0,
  repeatMode: d.repeat_mode as MissionRepeatMode,
  points: d.points,
  minTier: d.min_tier ?? 1,
  state: (d.state ?? 'in_progress') as MissionState,
  progress: d.progress ?? 0,
  completedCount: d.completed_count ?? 0,
  readyAt: d.ready_at ?? undefined,
  startedAt: d.started_at ?? undefined,
  claimable: Boolean(d.claimable),
  locked: Boolean(d.locked),
  lockReason: (d.lock_reason || undefined) as MissionLockReason | undefined,
});

const toReward = (d: RewardDTO): Reward => ({
  id: d.id,
  code: d.code,
  title: d.title,
  description: d.description ?? '',
  imageUrl: d.image_url ? mediaUrl(d.image_url) : undefined,
  kind: d.kind as RewardKind,
  cost: d.cost,
  tierLevel: d.tier_level ?? undefined,
  days: d.days ?? undefined,
  inputLabel: d.input_label || undefined,
  inputRequired: Boolean(d.input_required),
  stockLeft: d.stock_left ?? undefined,
  perUserLimit: d.per_user_limit ?? undefined,
  myCount: d.my_count ?? 0,
  affordable: Boolean(d.affordable),
  redeemable: Boolean(d.redeemable),
  reason: (d.reason || undefined) as RewardBlockReason | undefined,
  queueNotice: Boolean(d.queue_notice),
});

const toRedemption = (d: RedemptionDTO): Redemption => ({
  id: d.id,
  rewardTitle: d.reward_title ?? '',
  rewardKind: (d.reward_kind ?? 'manual') as RewardKind,
  cost: d.cost,
  status: d.status as RedemptionStatus,
  grantedDays: d.granted_days ?? 0,
  grantedTier: d.granted_tier ?? undefined,
  userInput: d.user_input || undefined,
  adminNote: d.admin_note || undefined,
  queued: Boolean(d.queued),
  createdAt: d.created_at,
});

export class MissionsRepositoryImpl implements MissionsRepository {
  constructor(private readonly http: HttpClient) {}

  async getMissions(): Promise<MissionsOverview> {
    const d = await this.http.request<{
      enabled?: boolean;
      missions?: MissionDTO[] | null;
      points?: PointsDTO;
      referral_card?: {
        title: string;
        description: string;
        points: number;
        cta_label: string;
        cta_url: string;
      };
    }>('/api/me/missions');
    return {
      enabled: Boolean(d?.enabled),
      missions: (d?.missions ?? []).map(toMission),
      points: toPoints(d?.points),
      referralCard: d?.referral_card
        ? {
            title: d.referral_card.title,
            description: d.referral_card.description,
            points: d.referral_card.points,
            ctaLabel: d.referral_card.cta_label,
            ctaUrl: d.referral_card.cta_url,
          }
        : undefined,
    };
  }

  async getLeaderboard(window: LeaderWindow): Promise<Leaderboard> {
    const d = await this.http.request<LeaderboardDTO>(
      `/api/me/leaderboard?window=${window}`
    );
    return {
      window: (d?.window ?? window) as LeaderWindow,
      label: d?.label ?? '',
      entries: (d?.entries ?? []).map(toLeaderEntry),
      me: {
        rank: d?.me?.rank ?? 0,
        points: d?.me?.points ?? 0,
        inTop: Boolean(d?.me?.in_top),
      },
      total: d?.total ?? 0,
      resetsAt: d?.resets_at ?? undefined,
    };
  }

  async getMission(missionId: number): Promise<Mission> {
    const d = await this.http.request<{ mission: MissionDTO }>(
      `/api/me/missions/${missionId}`
    );
    return toMission(d.mission);
  }

  async uploadProof(missionId: number, uri: string): Promise<MissionProof> {
    const d = await this.http.upload<{ proof: MissionProofDTO }>(
      `/api/me/missions/${missionId}/proof`,
      uri
    );
    return toProof(d.proof);
  }

  async deleteProof(proofId: number): Promise<void> {
    await this.http.request(`/api/me/mission-proofs/${proofId}`, { method: 'DELETE' });
  }

  async startMission(missionId: number): Promise<Mission> {
    const d = await this.http.request<{ mission: MissionDTO }>(
      `/api/me/missions/${missionId}/start`,
      { method: 'POST' }
    );
    return toMission(d.mission);
  }

  async claimMission(missionId: number, proof?: string) {
    const d = await this.http.request<{ mission: MissionDTO; points?: PointsDTO }>(
      `/api/me/missions/${missionId}/claim`,
      { method: 'POST', body: { proof: proof ?? '' } }
    );
    return { mission: toMission(d.mission), points: toPoints(d.points) };
  }

  async getPoints(page = 1) {
    const d = await this.http.request<{
      points?: PointsDTO;
      ledger?: {
        id: number;
        delta: number;
        reason: string;
        title: string;
        created_at: string;
      }[] | null;
      total?: number;
    }>(`/api/me/points?page=${page}`);
    const ledger: PointEntry[] = (d?.ledger ?? []).map((e) => ({
      id: e.id,
      delta: e.delta,
      reason: e.reason,
      title: e.title,
      createdAt: e.created_at,
    }));
    return { points: toPoints(d?.points), ledger, total: d?.total ?? ledger.length };
  }

  async getRewards(): Promise<RewardsOverview> {
    const d = await this.http.request<{
      rewards?: RewardDTO[] | null;
      points?: PointsDTO;
      sub_cap?: {
        monthly_days: number;
        used_days: number;
        remaining_days: number;
        max_tier: number;
      };
    }>('/api/rewards');
    return {
      rewards: (d?.rewards ?? []).map(toReward),
      points: toPoints(d?.points),
      subCap: {
        monthlyDays: d?.sub_cap?.monthly_days ?? 0,
        usedDays: d?.sub_cap?.used_days ?? 0,
        remainingDays: d?.sub_cap?.remaining_days ?? 0,
        maxTier: d?.sub_cap?.max_tier ?? 0,
      },
    };
  }

  async redeemReward(rewardId: number, idemKey: string, userInput?: string): Promise<RedeemResult> {
    const d = await this.http.request<{
      redemption: RedemptionDTO;
      points?: PointsDTO;
      outcome?: string;
      active_until?: string;
    }>(`/api/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: { idem_key: idemKey, user_input: userInput ?? '' },
    });
    return {
      redemption: toRedemption(d.redemption),
      points: toPoints(d.points),
      outcome: d.outcome,
      activeUntil: d.active_until,
    };
  }

  async getRedemptions(page = 1) {
    const d = await this.http.request<{
      redemptions?: RedemptionDTO[] | null;
      total?: number;
    }>(`/api/me/redemptions?page=${page}`);
    const items = (d?.redemptions ?? []).map(toRedemption);
    return { items, total: d?.total ?? items.length };
  }

  async getReferral(page = 1): Promise<ReferralOverview> {
    const d = await this.http.request<{
      summary: {
        code: string;
        total: number;
        qualified: number;
        pending: number;
        points_earned: number;
        inviter_points: number;
        invitee_points: number;
        qualify_rule: string;
        grace_days: number;
        can_enter_code: boolean;
        enabled: boolean;
      };
      invitees?: RefRowDTO[] | null;
      total?: number;
    }>(`/api/me/referral?page=${page}`);
    const invitees: Invitee[] = (d?.invitees ?? []).map((r) => ({
      id: r.id,
      userId: r.invitee_id,
      name: r.invitee_name || '',
      photoUrl: r.invitee_photo ? mediaUrl(r.invitee_photo) : undefined,
      status: r.status as ReferralStatus,
      inviterPoints: r.inviter_points ?? 0,
      createdAt: r.created_at,
      qualifiedAt: r.qualified_at ?? undefined,
    }));
    return {
      summary: {
        code: d?.summary?.code ?? '',
        total: d?.summary?.total ?? 0,
        qualified: d?.summary?.qualified ?? 0,
        pending: d?.summary?.pending ?? 0,
        pointsEarned: d?.summary?.points_earned ?? 0,
        inviterPoints: d?.summary?.inviter_points ?? 0,
        inviteePoints: d?.summary?.invitee_points ?? 0,
        qualifyRule: d?.summary?.qualify_rule ?? '',
        graceDays: d?.summary?.grace_days ?? 0,
        canEnterCode: Boolean(d?.summary?.can_enter_code),
        enabled: Boolean(d?.summary?.enabled),
      },
      invitees,
      total: d?.total ?? invitees.length,
    };
  }

  async redeemReferralCode(code: string, deviceId?: string): Promise<PointsState> {
    const d = await this.http.request<{ points?: PointsDTO }>('/api/me/referral/redeem', {
      method: 'POST',
      body: { code, device_id: deviceId ?? '' },
    });
    return toPoints(d?.points);
  }
}
