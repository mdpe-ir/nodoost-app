import { useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';

export function useChatMediaUri(
  matchId: number,
  messageId: number | undefined,
  kind: 'photo' | 'voice',
  mime?: string
) {
  const uc = useCases();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!messageId) return;
    let alive = true;
    setLoading(true);
    setError(false);
    uc.chat
      .resolveMediaUri(matchId, messageId, kind, mime)
      .then((u) => {
        if (alive) setUri(u);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uc, matchId, messageId, kind, mime]);

  return { uri, loading, error };
}
