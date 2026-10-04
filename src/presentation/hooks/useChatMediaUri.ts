import { useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';

export function useChatMediaUri(
  matchId: number,
  messageId: number | undefined,
  kind: 'photo' | 'voice',
  mime?: string,
  onProgress?: (ratio: number) => void
) {
  const uc = useCases();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!messageId) {
        if (!alive) return;
        setUri(null);
        setLoading(false);
        setError(false);
        return;
      }
      if (!alive) return;
      setLoading(true);
      setError(false);
      setUri(null);
      onProgress?.(0);
      try {
        const u = await uc.chat.resolveMediaUri(matchId, messageId, kind, mime, (r) => {
          if (alive) onProgress?.(r);
        });
        if (alive) {
          setUri(u);
          onProgress?.(1);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // onProgress intentionally omitted — callers pass inline setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uc, matchId, messageId, kind, mime]);

  return { uri, loading, error };
}
