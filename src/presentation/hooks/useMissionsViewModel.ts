import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import type {
  Mission,
  MissionsOverview,
  PointEntry,
  PointsState,
  RedeemResult,
  Redemption,
  RewardsOverview,
} from '@/domain/entities';

/** پیامِ فارسیِ خطاهای پایدارِ سرور. کدها عمداً پایدارند تا متنِ اپ به متنِ
 *  سرور وابسته نشود. */
const ERRORS: Record<string, string> = {
  too_soon: 'کمی صبر کن؛ هنوز زود است.',
  already_done: 'این ماموریت را قبلاً انجام داده‌ای.',
  exhausted: 'دفعاتِ این ماموریت تمام شده.',
  not_eligible: 'هنوز شرایطِ این ماموریت را نداری.',
  proof_required: 'باید توضیح یا مدرک بفرستی.',
  under_review: 'مدرکت در حالِ بررسی است؛ تا اعلامِ نتیجه صبر کن.',
  no_attempts_left: 'دفعاتِ ارسالِ مدرک برای این ماموریت تمام شده.',
  proof_limit_reached: 'بیشتر از این نمی‌توانی عکس اضافه کنی.',
  proof_not_accepted: 'این ماموریت عکس نمی‌پذیرد.',
  too_many_pending: 'چند مدرکِ بررسی‌نشده داری؛ اول نتیجه‌ی آن‌ها را ببین.',
  invalid_image: 'این فایل عکسِ معتبری نیست.',
  wrong_kind: 'این کار برای این ماموریت معنا ندارد.',
  insufficient_points: 'امتیازت کافی نیست.',
  out_of_stock: 'موجودیِ این جایزه تمام شده.',
  user_limit: 'سقفِ دریافتِ این جایزه را پر کرده‌ای.',
  rank_too_low: 'رتبه‌ات برای این جایزه کافی نیست.',
  monthly_cap: 'سقفِ اشتراکِ رایگانِ این ماه پر شده.',
  tier_cap: 'این سطح با امتیاز قابلِ دریافت نیست.',
  input_required: 'اطلاعاتِ خواسته‌شده را وارد کن.',
  disabled: 'این بخش فعلاً غیرفعال است.',
  not_found: 'پیدا نشد.',
};

export const missionErrorText = (e: unknown): string => {
  if (e instanceof ApiError) {
    return ERRORS[e.code ?? ''] ?? 'مشکلی پیش آمد؛ دوباره تلاش کن.';
  }
  return 'مشکلی پیش آمد؛ دوباره تلاش کن.';
};

/**
 * ویومدلِ صفحه‌ی ماموریت‌ها: سه بخشِ «ماموریت / جایزه / امتیازِ من» را با هم
 * می‌گیرد و کنش‌ها را انجام می‌دهد.
 *
 * بعد از هر کنشِ موفق، بخشِ مربوطه دوباره از سرور خوانده می‌شود — وضعیتِ
 * ماموریت و امتیاز هر دو سمتِ سرور تصمیم‌گیری می‌شوند و بازسازیِ محلی‌شان
 * دیر یا زود با واقعیت اختلاف پیدا می‌کرد.
 */
export function useMissionsViewModel() {
  const uc = useCases();

  const [overview, setOverview] = useState<MissionsOverview | null>(null);
  const [rewards, setRewards] = useState<RewardsOverview | null>(null);
  const [ledger, setLedger] = useState<PointEntry[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [busyMission, setBusyMission] = useState<number | null>(null);
  const [busyReward, setBusyReward] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // کلیدِ یکتاسازیِ بازخرید. عوض‌شدنش فقط پس از موفقیت، یعنی ارسالِ دوباره‌ی
  // همان درخواست (شبکه‌ی ضعیف) دو جایزه نمی‌دهد.
  const idemRef = useRef<Record<number, string>>({});

  const fetchAll = useCallback(async () => {
    const [ov, rw, pts, reds] = await Promise.all([
      uc.missions.getMissions(),
      uc.missions.getRewards().catch(() => null),
      uc.missions.getPoints(1).catch(() => null),
      uc.missions.getRedemptions(1).catch(() => null),
    ]);
    setOverview(ov);
    if (rw) setRewards(rw);
    if (pts) setLedger(pts.ledger);
    if (reds) setRedemptions(reds.items);
  }, [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      await fetchAll();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAll();
    } catch {
      /* نوارِ تازه‌سازی نباید صفحه‌ی پرشده را خالی کند */
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll]);

  const patchMission = useCallback((m: Mission) => {
    setOverview((prev) =>
      prev ? { ...prev, missions: prev.missions.map((x) => (x.id === m.id ? m : x)) } : prev
    );
  }, []);

  const setPoints = useCallback((p: PointsState) => {
    setOverview((prev) => (prev ? { ...prev, points: p } : prev));
    setRewards((prev) => (prev ? { ...prev, points: p } : prev));
  }, []);

  const start = useCallback(
    async (missionId: number) => {
      setBusyMission(missionId);
      try {
        patchMission(await uc.missions.startMission(missionId));
      } catch (e) {
        setToast(missionErrorText(e));
      } finally {
        setBusyMission(null);
      }
    },
    [uc, patchMission]
  );

  const claim = useCallback(
    async (missionId: number, proof?: string) => {
      setBusyMission(missionId);
      try {
        const res = await uc.missions.claimMission(missionId, proof);
        patchMission(res.mission);
        setPoints(res.points);
        setToast(
          res.mission.state === 'pending_review'
            ? 'فرستاده شد؛ پس از بررسی امتیازت اضافه می‌شود.'
            : `${res.mission.points} امتیاز گرفتی 🎉`
        );
        // فهرست و دفتر باید با واقعیتِ سرور هم‌تراز شوند (ماموریتِ چندمرحله‌ای،
        // ارتقای رتبه، …) — بازسازیِ محلی این‌ها را نمی‌گیرد.
        void fetchAll();
      } catch (e) {
        setToast(missionErrorText(e));
      } finally {
        setBusyMission(null);
      }
    },
    [uc, patchMission, setPoints, fetchAll]
  );

  const redeem = useCallback(
    async (rewardId: number, userInput?: string): Promise<RedeemResult | null> => {
      setBusyReward(rewardId);
      const key =
        idemRef.current[rewardId] ??
        `${rewardId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      idemRef.current[rewardId] = key;
      try {
        const res = await uc.missions.redeemReward(rewardId, key, userInput);
        delete idemRef.current[rewardId];
        setPoints(res.points);
        void fetchAll();
        return res;
      } catch (e) {
        setToast(missionErrorText(e));
        return null;
      } finally {
        setBusyReward(null);
      }
    },
    [uc, setPoints, fetchAll]
  );

  return {
    overview,
    rewards,
    ledger,
    redemptions,
    points: overview?.points ?? rewards?.points ?? null,
    loading,
    refreshing,
    error,
    busyMission,
    busyReward,
    toast,
    clearToast: () => setToast(null),
    reload: load,
    refresh,
    start,
    claim,
    redeem,
  };
}
