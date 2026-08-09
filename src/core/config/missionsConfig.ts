import type { Rank } from '@/domain/entities';

/**
 * پرچم‌ها و نردبانِ رتبه از `GET /api/config`.
 *
 * fallback محلی عمداً هم‌گام با seedِ مهاجرت است: اگر سرور قدیمی باشد و کلیدِ
 * `missions` را نفرستد، نشانِ رتبه خالی نمی‌ماند — همان کاری که برای کاتالوگِ
 * علاقه‌مندی‌ها شد. پرچم‌ها ولی پیش‌فرضِ خاموش دارند تا قابلیتِ نیمه‌کاره روی
 * سرورِ قدیمی ظاهر نشود.
 */
export interface MissionsConfig {
  enabled: boolean;
  referralEnabled: boolean;
  referralInviterPoints: number;
  referralInviteePoints: number;
  ranks: Rank[];
}

export const defaultRankLadder: Rank[] = [
  { level: 0, name: 'تازه‌وارد', minPoints: 0, color: '#8A8595' },
  { level: 1, name: 'فعال', minPoints: 100, color: '#5AC8A8' },
  { level: 2, name: 'حرفه‌ای', minPoints: 500, color: '#5A9BC8' },
  { level: 3, name: 'ستاره', minPoints: 1500, color: '#C8A15A' },
  { level: 4, name: 'افسانه', minPoints: 5000, color: '#C85A9B' },
];

export const emptyMissionsConfig: MissionsConfig = {
  enabled: false,
  referralEnabled: false,
  referralInviterPoints: 0,
  referralInviteePoints: 0,
  ranks: defaultRankLadder,
};

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export function parseMissionsConfig(raw: unknown): MissionsConfig {
  if (!raw || typeof raw !== 'object') return emptyMissionsConfig;
  const o = raw as Record<string, unknown>;
  const rawRanks = Array.isArray(o.ranks) ? o.ranks : [];
  const ranks: Rank[] = [];
  for (const r of rawRanks) {
    const x = r as Record<string, unknown> | null;
    if (!x || typeof x.name !== 'string') continue;
    ranks.push({
      level: num(x.level, 0),
      name: x.name,
      minPoints: num(x.min_points, 0),
      color: typeof x.color === 'string' ? x.color : undefined,
      icon: typeof x.icon === 'string' ? x.icon : undefined,
    });
  }
  ranks.sort((a, b) => a.minPoints - b.minPoints);

  return {
    enabled: o.enabled === true,
    referralEnabled: o.referral_enabled === true,
    referralInviterPoints: num(o.referral_inviter_points, 0),
    referralInviteePoints: num(o.referral_invitee_points, 0),
    ranks: ranks.length ? ranks : defaultRankLadder,
  };
}
