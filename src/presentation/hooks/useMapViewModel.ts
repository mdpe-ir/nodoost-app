import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import { resolveLocation } from '@/core/utils/location';
import type { MapUser, ActiveFilter } from '@/domain/entities';

export interface MyLocation {
  lat: number;
  lng: number;
}

export type PermissionState = 'unknown' | 'granted' | 'denied';

/**
 * ویومدلِ نقشه. اول مجوزِ موقعیت را می‌گیرد و مختصاتِ فعلی را با
 * PUT /api/me/location ذخیره می‌کند، سپس کاربرانِ نزدیکِ روی نقشه را می‌آورد.
 * منطقِ مجوز از useDiscoverViewModel بازاستفاده شده است.
 *
 * فیلترها (شعاع/فعالیت/چهره‌نما) روی سرور دوباره سنجیده می‌شوند؛ سقفِ شعاع از سطحِ
 * عضویتِ کاربر می‌آید و در پاسخ (maxRadiusKm) برمی‌گردد. شعاعِ انتخابی null یعنی
 * «کلِ سقفِ سطح»؛ سرور همان سقف را اعمال و برمی‌گرداند.
 */
export function useMapViewModel() {
  const uc = useCases();
  const [me, setMe] = useState<MyLocation | null>(null);
  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  // فیلترها. شعاع بر حسبِ کیلومتر؛ null = سقفِ سطح (پیش‌فرض). سقفِ مجاز از سرور.
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(0);
  const [active, setActive] = useState<ActiveFilter>('');
  const [verified, setVerified] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await uc.discovery.getNearbyMapUsers({
        radiusM: radiusKm != null ? radiusKm * 1000 : undefined,
        active: active || undefined,
        verified: verified || undefined,
      });
      setUsers(res.users);
      if (res.maxRadiusKm > 0) setMaxRadiusKm(res.maxRadiusKm);
      setError(null);
    } catch (e) {
      setUsers([]);
      setError(e instanceof ApiError ? e.code ?? `HTTP ${e.status}` : 'network');
    }
  }, [uc, radiusKm, active, verified]);

  // مجوز را می‌گیرد، موقعیت را ذخیره می‌کند و me را ست می‌کند. حالتِ مجوز را برمی‌گرداند.
  // فقط ردِ مجوز (`denied`) صفحه‌ی «موقعیت روشن نیست» را نشان می‌دهد؛ اگر مجوز هست ولی
  // fix هنوز آماده نشده (`unavailable`)، نقشه را پنهان نمی‌کنیم و کاربران را از سرور می‌آوریم.
  const captureLocation = useCallback(
    async (interactive = false): Promise<PermissionState> => {
      const res = await resolveLocation(interactive);
      if (res.ok) {
        setPermissionState('granted');
        setMe(res.coords);
        // ذخیره‌ی موقعیت روی سرور شبکه‌ای است؛ شکستش نباید نقشه را پنهان کند.
        await uc.profile.setLocation(res.coords.lat, res.coords.lng).catch(() => {});
        return 'granted';
      }
      const state: PermissionState = res.reason === 'denied' ? 'denied' : 'granted';
      setPermissionState(state);
      return state;
    },
    [uc]
  );

  // نقشه فقط با دسترسیِ موقعیت باز می‌شود. اگر مجوز نبود، کاربر را نمی‌آوریم و
  // صفحه به درخواستِ روشن‌کردنِ موقعیت می‌رود.
  const refresh = useCallback(async () => {
    setLoading(true);
    const state = await captureLocation(true);
    if (state !== 'denied') await fetchUsers();
    setLoading(false);
  }, [captureLocation, fetchUsers]);

  // بارگذاریِ اول: مجوز + موقعیت + کاربران.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const state = await captureLocation(false);
      if (!alive) return;
      if (state !== 'denied') await fetchUsers();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // فقط یک‌بار در mount؛ تغییرِ فیلترها را افکتِ جدا مدیریت می‌کند.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureLocation]);

  // با تغییرِ فیلترها فقط کاربران را دوباره می‌آوریم (بدونِ گرفتنِ دوباره‌ی موقعیت).
  // بارِ اول (mount) را رد می‌کنیم تا دوبار fetch نشود.
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (permissionState === 'denied') return;
    let alive = true;
    (async () => {
      setLoading(true);
      await fetchUsers();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, active, verified]);

  return {
    me,
    users,
    loading,
    error,
    refresh,
    permissionState,
    // فیلترها
    radiusKm,
    maxRadiusKm,
    active,
    verified,
    setRadiusKm,
    setActive,
    setVerified,
  };
}
