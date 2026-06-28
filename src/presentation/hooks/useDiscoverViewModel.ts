import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import type { Candidate, MatchResult } from '@/domain/entities';

/**
 * ویومدلِ کاوش. کارت‌ها بلافاصله بارگذاری می‌شوند و موقعیت در پس‌زمینه ست
 * می‌شود؛ پس صفحه هیچ‌وقت منتظرِ GPS بلاک نمی‌ماند.
 */
export function useDiscoverViewModel() {
  const uc = useCases();
  const [cards, setCards] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const list = await uc.discovery.getCandidates();
        setCards(list);
        setIndex(0);
      } catch (e) {
        setCards([]);
        setError(e instanceof ApiError ? e.code ?? `HTTP ${e.status}` : 'network');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [uc]
  );

  useEffect(() => {
    let alive = true;
    load();
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const loc = await Location.getCurrentPositionAsync({}).catch(() => null);
        if (alive && loc) {
          await uc.profile.setLocation(loc.coords.latitude, loc.coords.longitude);
          if (alive) load(true);
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [uc, load]);

  const current = cards[index];

  const swipe = useCallback(
    async (action: 'like' | 'pass') => {
      const target = cards[index];
      if (!target) return;
      setIndex((i) => i + 1);
      try {
        const result = await uc.discovery.swipe(target.id, action);
        if (action === 'like' && (result.peer || result.matchId)) {
          setMatch({ matchId: result.matchId, peer: result.peer ?? target });
        }
      } catch {}
    },
    [cards, index, uc]
  );

  return {
    current,
    loading,
    error,
    match,
    swipe,
    reload: () => load(),
    dismissMatch: () => setMatch(null),
  };
}
