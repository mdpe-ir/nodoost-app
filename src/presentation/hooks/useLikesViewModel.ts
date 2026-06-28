import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { LikesOverview } from '@/domain/entities';

/** ویومدلِ پسندها: تعداد + آشکار/قفل + فهرست. */
export function useLikesViewModel() {
  const uc = useCases();
  const [data, setData] = useState<LikesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await uc.likes.getLikes());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
