import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import type { Candidate, MatchResult } from '@/domain/entities';

const PAGE_SIZE = 24;

/**
 * ویومدلِ اکسپلور — گریدِ عکس‌محور با همان الگوریتمِ کاوش (وزنِ جنسیت: جنسِ
 * مقابل بالاتر) اما صفحه‌بندی‌شده برای اسکرولِ بی‌نهایت. مثلِ useDiscoverViewModel
 * موقعیت را در پس‌زمینه ست می‌کند تا کاربر برای دیگران قابلِ کشف بماند.
 */
export function useExploreViewModel() {
  const uc = useCases();
  const [items, setItems] = useState<Candidate[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  // فیلترِ سطحِ کاربران (۰ = همه). فقط سطح‌های در دسترسِ کاربر سمتِ UI باز است.
  const [tierFilter, setTierFilter] = useState(0);
  const tierFilterRef = useRef(0);
  // شناسه‌هایی که کنش‌شان کرده‌ایم تا از گرید حذف شوند و دوباره برنگردند.
  const actedRef = useRef<Set<number>>(new Set());

  const loadPage = useCallback(
    async (p: number, mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'initial') setLoading(true);
      else if (mode === 'more') setLoadingMore(true);
      else setRefreshing(true);
      setError(null);
      try {
        const list = await uc.discovery.getExplore(p, PAGE_SIZE, tierFilterRef.current || undefined);
        const fresh = list.filter((c) => !actedRef.current.has(c.id));
        setItems((prev) => (mode === 'more' ? [...prev, ...fresh] : fresh));
        setPage(p);
        setHasMore(list.length >= PAGE_SIZE);
      } catch (e) {
        if (mode !== 'more') setItems([]);
        setError(e instanceof ApiError ? e.code ?? `HTTP ${e.status}` : 'network');
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [uc]
  );

  const captureLocation = useCallback(
    async (interactive = false): Promise<boolean> => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) {
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (!perm.granted) {
          if (interactive && !perm.canAskAgain) await Linking.openSettings().catch(() => {});
          setNeedsLocation(true);
          return false;
        }
        const loc = await Location.getCurrentPositionAsync({}).catch(() => null);
        if (!loc) {
          setNeedsLocation(true);
          return false;
        }
        await uc.profile.setLocation(loc.coords.latitude, loc.coords.longitude);
        setNeedsLocation(false);
        return true;
      } catch {
        setNeedsLocation(true);
        return false;
      }
    },
    [uc]
  );

  useEffect(() => {
    let alive = true;
    loadPage(1, 'initial');
    (async () => {
      let hasLocation = false;
      try {
        const me = await uc.profile.getMe();
        hasLocation = me?.hasLocation ?? false;
      } catch {}
      if (!alive || hasLocation) return;
      const ok = await captureLocation(false);
      if (alive && ok) loadPage(1, 'refresh');
    })();
    return () => {
      alive = false;
    };
  }, [uc, loadPage, captureLocation]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    loadPage(page + 1, 'more');
  }, [loading, loadingMore, refreshing, hasMore, page, loadPage]);

  const refresh = useCallback(() => {
    if (refreshing) return;
    loadPage(1, 'refresh');
  }, [refreshing, loadPage]);

  const setTier = useCallback(
    (t: number) => {
      tierFilterRef.current = t;
      setTierFilter(t);
      loadPage(1, 'refresh');
    },
    [loadPage]
  );

  const enableLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    const ok = await captureLocation(true);
    setLocating(false);
    if (ok) loadPage(1, 'refresh');
  }, [locating, captureLocation, loadPage]);

  const swipe = useCallback(
    async (target: Candidate, action: 'like' | 'pass') => {
      actedRef.current.add(target.id);
      setSelected(null);
      setItems((prev) => prev.filter((c) => c.id !== target.id));
      try {
        const result = await uc.discovery.swipe(target.id, action);
        if (action === 'like' && (result.peer || result.matchId)) {
          setMatch({ matchId: result.matchId, peer: result.peer ?? target });
        }
      } catch {}
    },
    [uc]
  );

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    selected,
    match,
    needsLocation,
    locating,
    tierFilter,
    setTier,
    loadMore,
    refresh,
    reload: refresh,
    enableLocation,
    select: setSelected,
    dismissSelected: () => setSelected(null),
    swipe,
    dismissMatch: () => setMatch(null),
  };
}
