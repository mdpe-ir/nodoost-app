import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import type { Conversation } from '@/domain/entities';

/** ویومدلِ فهرستِ گفتگوها — با خطا، کشیدن‌برای‌تازه‌سازی و بارگذاریِ صفحه‌به‌صفحه. */
export function useChatViewModel() {
  const uc = useCases();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const page = useRef(1);

  const fetchFirst = useCallback(async () => {
    page.current = 1;
    const p = await uc.chat.getConversations(1);
    setItems(p.items);
    setHasMore(p.hasMore);
  }, [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      await fetchFirst();
    } catch {
      setItems([]);
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
      /* فهرستِ فعلی را نگه می‌داریم */
    } finally {
      setRefreshing(false);
    }
  }, [fetchFirst]);

  /** صفحه‌ی بعدیِ گفتگوها را می‌گیرد و به فهرست می‌افزاید. */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const p = await uc.chat.getConversations(page.current + 1);
      page.current += 1;
      setHasMore(p.hasMore);
      // در برابرِ گفتگوهایی که بینِ صفحه‌ها جابه‌جا شده‌اند، تکراری‌ها را حذف کن.
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.matchId));
        return [...prev, ...p.items.filter((c) => !seen.has(c.matchId))];
      });
    } catch {
      /* دوباره تلاش می‌شود */
    } finally {
      setLoadingMore(false);
    }
  }, [uc, loadingMore, hasMore]);

  useEffect(() => {
    load();
  }, [load]);

  // با بازگشت به تب یا بازکردنِ دوباره‌ی اپ، فهرستِ گفتگوها را بی‌صدا تازه کن.
  useRefetchOnFocus(refresh);

  return { items, loading, refreshing, loadingMore, hasMore, error, reload: load, refresh, loadMore };
}
