import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useBadges } from '@/presentation/providers/BadgesProvider';
import type { AppNotification } from '@/domain/entities';

/**
 * ویومدلِ صفحه‌ی اعلان‌ها: بارگذاریِ صفحه‌بندی‌شده، تازه‌سازیِ کششی، و علامتِ
 * «دیده‌شده/خوانده‌شده».
 *
 * تفاوتِ «دیده» و «خوانده» عمدی است: با مونت‌شدنِ صفحه همه *دیده* می‌شوند
 * (نشانِ زنگوله صفر می‌شود) ولی برجستگیِ کارت‌ها می‌ماند تا کاربر تک‌تک بازشان کند.
 */
export function useNotificationsViewModel() {
  const uc = useCases();
  const { refresh: refreshBadges, clearNotificationsBadge } = useBadges();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const page = useRef(1);

  const fetchFirst = useCallback(async () => {
    page.current = 1;
    const first = await uc.notifications.list(1);
    setItems(first.items);
    setTotal(first.total ?? first.items.length);
    setHasMore(first.hasMore);
  }, [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      await fetchFirst();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchFirst]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFirst();
      setError(false);
    } catch {
      /* داده‌ی فعلی را نگه می‌داریم */
    } finally {
      setRefreshing(false);
    }
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await uc.notifications.list(page.current + 1);
      page.current += 1;
      setHasMore(next.hasMore);
      setItems((prev) => [...prev, ...next.items]);
    } catch {
      /* در تلاشِ بعدی دوباره امتحان می‌شود */
    } finally {
      setLoadingMore(false);
    }
  }, [uc, loadingMore, hasMore]);

  useEffect(() => {
    load();
  }, [load]);

  // با بازشدنِ صفحه همه «دیده» می‌شوند — نشانِ زنگوله فوراً صفر می‌شود.
  const seenSentRef = useRef(false);
  useEffect(() => {
    if (seenSentRef.current) return;
    seenSentRef.current = true;
    (async () => {
      try {
        await uc.notifications.markSeen();
        clearNotificationsBadge();
        setItems((prev) => prev.map((n) => (n.seen ? n : { ...n, seen: true })));
      } catch {
        /* نادیده — دفعه‌ی بعد دوباره تلاش می‌شود */
      }
    })();
  }, [uc, clearNotificationsBadge]);

  /** خواندنِ خوش‌بینانه‌ی یک کارت (با ضربه روی آن). */
  const markRead = useCallback(
    async (id: number) => {
      const target = items.find((n) => n.id === id);
      if (!target || target.read) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, seen: true } : n)));
      try {
        await uc.notifications.markRead([id]);
        refreshBadges();
      } catch {
        // برگرداندنِ حالتِ خوش‌بینانه در صورتِ شکست
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      }
    },
    [items, uc, refreshBadges]
  );

  /** «همه را خواندم» — برجستگیِ همه‌ی کارت‌ها برداشته می‌شود. */
  const markAllRead = useCallback(async () => {
    if (items.every((n) => n.read)) return;
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true, seen: true })));
    try {
      await uc.notifications.markAllRead();
      refreshBadges();
    } catch {
      setItems(snapshot);
    }
  }, [items, uc, refreshBadges]);

  return {
    items,
    total,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    reload: load,
    refresh,
    loadMore,
    markRead,
    markAllRead,
    hasUnread: items.some((n) => !n.read),
  };
}
