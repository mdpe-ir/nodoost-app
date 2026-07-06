import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { Liker, LikesOverview } from '@/domain/entities';

/** ویومدلِ پسندها: دریافتی (تعداد + آشکار/قفل) و ارسالی — با کشیدن‌برای‌تازه‌سازی. */
export function useLikesViewModel() {
  const uc = useCases();
  const [data, setData] = useState<LikesOverview | null>(null);
  const [sent, setSent] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchBoth = useCallback(async () => {
    const [overview, sentList] = await Promise.all([
      uc.likes.getLikes(),
      uc.likes.getSentLikes().catch(() => [] as Liker[]),
    ]);
    setData(overview);
    setSent(sentList);
  }, [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      await fetchBoth();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchBoth]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBoth();
      setError(false);
    } catch {
      /* داده‌ی فعلی را نگه می‌داریم */
    } finally {
      setRefreshing(false);
    }
  }, [fetchBoth]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, sent, loading, refreshing, error, reload: load, refresh };
}
