import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
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

  // مجوز را می‌گیرد، موقعیت را ذخیره می‌کند و me را ست می‌کند. اگر مجوز نبود false.
  const captureLocation = useCallback(
    async (interactive = false): Promise<boolean> => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) {
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (!perm.granted) {
          if (interactive && !perm.canAskAgain) await Linking.openSettings().catch(() => {});
          setPermissionState('denied');
          return false;
        }
        const loc = await Location.getCurrentPositionAsync({}).catch(() => null);
        if (!loc) {
          setPermissionState('denied');
          return false;
        }
        setPermissionState('granted');
        setMe({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        await uc.profile.setLocation(loc.coords.latitude, loc.coords.longitude);
        return true;
      } catch {
        setPermissionState('denied');
        return false;
      }
    },
    [uc]
  );

  // نقشه فقط با دسترسیِ موقعیت باز می‌شود. اگر مجوز نبود، کاربر را نمی‌آوریم و
  // صفحه به درخواستِ روشن‌کردنِ موقعیت می‌رود. با روشن‌شدن، همه‌ی کاربرانِ فعالِ
  // نقشه (نه فقط شعاعِ نزدیک) بارگذاری می‌شوند.
  const refresh = useCallback(async () => {
    setLoading(true);
    const ok = await captureLocation(true);
    if (ok) await fetchUsers();
    setLoading(false);
  }, [captureLocation, fetchUsers]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const ok = await captureLocation(false);
      if (!alive) return;
      if (ok) await fetchUsers();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [captureLocation, fetchUsers]);

  return { me, users, loading, error, refresh, permissionState };
}
