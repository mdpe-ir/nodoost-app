import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { FollowListKind, FollowUser } from '@/domain/entities';

interface ListState {
  items: FollowUser[];
  total: number;
  page: number;
  hasMore: boolean;
  loaded: boolean;
}

const EMPTY: ListState = { items: [], total: 0, page: 1, hasMore: false, loaded: false };

/**
 * ویومدلِ فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌ها. هر تب حافظه‌ی خودش را دارد و فقط
 * وقتی بارگذاری می‌شود که کاربر سراغش برود.
 * دنبال‌کردن رایگان است — این‌جا هیچ دروازه‌ی سطحی وجود ندارد.
 */
export function useFollowListViewModel(userId: number | undefined, initialTab: FollowListKind) {
  const uc = useCases();
  const [tab, setTab] = useState<FollowListKind>(initialTab);
  const [followers, setFollowers] = useState<ListState>(EMPTY);
  const [following, setFollowing] = useState<ListState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  /** شناسه‌هایی که همین حالا در حالِ دنبال/لغوِ دنبال‌اند. */
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const inFlight = useRef<FollowListKind | null>(null);

  const setFor = tab === 'followers' ? setFollowers : setFollowing;
  const current = tab === 'followers' ? followers : following;

  const fetchFirst = useCallback(
    async (kind: FollowListKind) => {
      const page = await uc.follow.getList(kind, userId, 1);
      const next: ListState = {
        items: page.items,
        total: page.total ?? page.items.length,
        page: 1,
        hasMore: page.hasMore,
        loaded: true,
      };
      if (kind === 'followers') setFollowers(next);
      else setFollowing(next);
    },
    [uc, userId]
  );

  const load = useCallback(
    async (kind: FollowListKind) => {
      if (inFlight.current === kind) return;
      inFlight.current = kind;
      setLoading(true);
      setError(false);
      try {
        await fetchFirst(kind);
      } catch {
        setError(true);
      } finally {
        inFlight.current = null;
        setLoading(false);
      }
    },
    [fetchFirst]
  );

  // اولین ورود به هر تب، آن تب را بارگذاری می‌کند.
  useEffect(() => {
    const state = tab === 'followers' ? followers : following;
    if (!state.loaded) load(tab);
    else setLoading(false);
  }, [tab, followers, following, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFirst(tab);
      setError(false);
    } catch {
      /* داده‌ی فعلی می‌ماند */
    } finally {
      setRefreshing(false);
    }
  }, [fetchFirst, tab]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !current.hasMore) return;
    setLoadingMore(true);
    try {
      const next = await uc.follow.getList(tab, userId, current.page + 1);
      setFor((prev) => ({
        ...prev,
        items: [...prev.items, ...next.items],
        page: prev.page + 1,
        hasMore: next.hasMore,
      }));
    } catch {
      /* در تلاشِ بعدی دوباره امتحان می‌شود */
    } finally {
      setLoadingMore(false);
    }
  }, [uc, tab, userId, current.hasMore, current.page, loadingMore, setFor]);

  /** دنبال/لغوِ دنبالِ خوش‌بینانه؛ در خطا به حالتِ قبل برمی‌گردد. */
  const toggleFollow = useCallback(
    async (target: FollowUser) => {
      if (busyIds.includes(target.id)) return;
      const next = !target.isFollowing;
      const apply = (value: boolean) => {
        const patch = (s: ListState): ListState => ({
          ...s,
          items: s.items.map((u) => (u.id === target.id ? { ...u, isFollowing: value } : u)),
        });
        setFollowers(patch);
        setFollowing(patch);
      };
      apply(next);
      setBusyIds((ids) => [...ids, target.id]);
      try {
        if (next) await uc.follow.follow(target.id);
        else await uc.follow.unfollow(target.id);
      } catch {
        apply(!next);
      } finally {
        setBusyIds((ids) => ids.filter((id) => id !== target.id));
      }
    },
    [uc, busyIds]
  );

  return {
    tab,
    setTab,
    items: current.items,
    total: current.total,
    hasMore: current.hasMore,
    followersTotal: followers.total,
    followingTotal: following.total,
    loading: loading && !current.loaded,
    refreshing,
    loadingMore,
    error,
    reload: () => load(tab),
    refresh,
    loadMore,
    toggleFollow,
    isBusy: (id: number) => busyIds.includes(id),
  };
}
