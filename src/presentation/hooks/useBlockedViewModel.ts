import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { BlockedUser } from '@/domain/entities';

/**
 * فهرستِ کاربرانِ مسدودشده + رفعِ مسدودی.
 *
 * این تنها راهِ رسیدن به یک کاربرِ بلاک‌شده است: او از کشف، فهرست‌ها و گفتگوها
 * غیب می‌شود، پس بدونِ این صفحه رفعِ بلاک عملاً ممکن نبود.
 */
export function useBlockedViewModel() {
  const uc = useCases();
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const p = await uc.safety.getBlocks(1);
        setItems(p.items);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [uc]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load(true);
  }, [load]);

  const unblock = useCallback(
    async (id: number) => {
      setBusyId(id);
      const before = items;
      setItems((prev) => prev.filter((b) => b.id !== id));
      try {
        await uc.safety.unblock(id);
      } catch {
        setItems(before); // برگرداندنِ حالتِ خوش‌بینانه
      } finally {
        setBusyId(null);
      }
    },
    [items, uc]
  );

  return { items, loading, refreshing, error, refresh, reload: load, unblock, busyId };
}
