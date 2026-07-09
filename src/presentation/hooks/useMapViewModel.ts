import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import { resolveLocation } from '@/core/utils/location';
import type { MapUser } from '@/domain/entities';

export interface MyLocation {
  lat: number;
  lng: number;
}

export type PermissionState = 'unknown' | 'granted' | 'denied';

/**
 * ویومدلِ نقشه. اول مجوزِ موقعیت را می‌گیرد و مختصاتِ فعلی را با
 * PUT /api/me/location ذخیره می‌کند، سپس کاربرانِ نزدیکِ روی نقشه را می‌آورد.
 * منطقِ مجوز از useDiscoverViewModel بازاستفاده شده است.
 */
export function useMapViewModel(radiusM = 25000) {
  const uc = useCases();
  const [me, setMe] = useState<MyLocation | null>(null);
  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  const fetchUsers = useCallback(async () => {
    try {
      const list = await uc.discovery.getNearbyMapUsers(radiusM);
      setUsers(list);
      setError(null);
    } catch (e) {
      setUsers([]);
      setError(e instanceof ApiError ? e.code ?? `HTTP ${e.status}` : 'network');
    }
  }, [uc, radiusM]);

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
  // صفحه به درخواستِ روشن‌کردنِ موقعیت می‌رود. با روشن‌شدن، همه‌ی کاربرانِ فعالِ
  // نقشه (نه فقط شعاعِ نزدیک) بارگذاری می‌شوند.
  const refresh = useCallback(async () => {
    setLoading(true);
    const state = await captureLocation(true);
    if (state !== 'denied') await fetchUsers();
    setLoading(false);
  }, [captureLocation, fetchUsers]);

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
  }, [captureLocation, fetchUsers]);

  return { me, users, loading, error, refresh, permissionState };
}
