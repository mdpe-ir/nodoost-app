import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import type { Conversation } from '@/domain/entities';

/** ویومدلِ فهرستِ گفتگوها — با خطا و کشیدن‌برای‌تازه‌سازی. */
export function useChatViewModel() {
  const uc = useCases();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await uc.chat.getConversations());
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await uc.chat.getConversations());
      setError(false);
    } catch {
      /* فهرستِ فعلی را نگه می‌داریم */
    } finally {
      setRefreshing(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);

  // با بازگشت به تب یا بازکردنِ دوباره‌ی اپ، فهرستِ گفتگوها را بی‌صدا تازه کن.
  useRefetchOnFocus(refresh);

  return { items, loading, refreshing, error, reload: load, refresh };
}
