import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { Liker, LikesOverview } from '@/domain/entities';

/**
 * ویومدلِ پسندها: دریافتی (تعداد + آشکار/قفل) و ارسالی — با کشیدن‌برای‌تازه‌سازی
 * و بارگذاریِ صفحه‌به‌صفحه (loadMore) برای هر دو تب.
 */
export function useLikesViewModel() {
  const uc = useCases();
  const [data, setData] = useState<LikesOverview | null>(null);
  const [sent, setSent] = useState<Liker[]>([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // وضعیتِ صفحه‌بندیِ هر تب.
  const [receivedHasMore, setReceivedHasMore] = useState(false);
  const [sentHasMore, setSentHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const receivedPage = useRef(1);
  const sentPage = useRef(1);

  const fetchFirst = useCallback(async () => {
    receivedPage.current = 1;
    sentPage.current = 1;
    const [overview, sentPageData] = await Promise.all([
      uc.likes.getLikes(1),
      uc.likes.getSentLikes(1).catch(() => ({ items: [], page: 1, hasMore: false, total: 0 })),
    ]);
    setData(overview);
    setReceivedHasMore(overview.hasMore);
    setSent(sentPageData.items);
    setSentTotal(sentPageData.total ?? sentPageData.items.length);
    setSentHasMore(sentPageData.hasMore);
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

  /** صفحه‌ی بعدیِ تبِ دریافتی را می‌گیرد و به فهرست می‌افزاید. */
  const loadMoreReceived = useCallback(async () => {
    if (loadingMore || !receivedHasMore || !data?.revealed) return;
    setLoadingMore(true);
    try {
      const next = await uc.likes.getLikes(receivedPage.current + 1);
      receivedPage.current += 1;
      setReceivedHasMore(next.hasMore);
      setData((prev) =>
        prev ? { ...prev, likers: [...prev.likers, ...next.likers], hasMore: next.hasMore } : next
      );
    } catch {
      /* در صفحه‌ی بعدی دوباره تلاش می‌شود */
    } finally {
      setLoadingMore(false);
    }
  }, [uc, loadingMore, receivedHasMore, data?.revealed]);

  /** صفحه‌ی بعدیِ تبِ ارسالی را می‌گیرد و به فهرست می‌افزاید. */
  const loadMoreSent = useCallback(async () => {
    if (loadingMore || !sentHasMore) return;
    setLoadingMore(true);
    try {
      const next = await uc.likes.getSentLikes(sentPage.current + 1);
      sentPage.current += 1;
      setSentHasMore(next.hasMore);
      setSent((prev) => [...prev, ...next.items]);
    } catch {
      /* در صفحه‌ی بعدی دوباره تلاش می‌شود */
    } finally {
      setLoadingMore(false);
    }
  }, [uc, loadingMore, sentHasMore]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    sent,
    sentTotal,
    loading,
    refreshing,
    error,
    loadingMore,
    receivedHasMore,
    sentHasMore,
    reload: load,
    refresh,
    loadMoreReceived,
    loadMoreSent,
  };
}
