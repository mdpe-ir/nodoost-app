import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { Conversation } from '@/domain/entities';

/** ویومدلِ فهرستِ گفتگوها. */
export function useChatViewModel() {
  const uc = useCases();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await uc.chat.getConversations());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}
