import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { PeerProfile, MatchResult } from '@/domain/entities';

/** ویومدلِ پروفایلِ عمومیِ یک کاربرِ دیگر: بارگذاری + پسند/رد. */
export function usePeerProfileViewModel(userId: number) {
  const uc = useCases();
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [swiping, setSwiping] = useState(false);
  /** پس از پسندِ بدونِ مچ، دکمه را قفل می‌کنیم تا دوباره نزند. */
  const [liked, setLiked] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProfile(await uc.discovery.getPeerProfile(userId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc, userId]);

  useEffect(() => {
    if (userId) load();
  }, [load, userId]);

  const [openingChat, setOpeningChat] = useState(false);

  /** matchId موجود را برمی‌گرداند یا گفتگوی مستقیم می‌سازد؛ در خطا null. */
  const startChat = useCallback(async (): Promise<number | null> => {
    if (profile?.matchId) return profile.matchId;
    setOpeningChat(true);
    try {
      return await uc.chat.startDirect(userId);
    } catch {
      return null;
    } finally {
      setOpeningChat(false);
    }
  }, [profile?.matchId, uc, userId]);

  const like = useCallback(async () => {
    if (swiping || liked) return;
    setSwiping(true);
    try {
      const r = await uc.discovery.swipe(userId, 'like');
      if (r.matchId) setMatch(r);
      else setLiked(true);
    } catch {
      /* نادیده */
    } finally {
      setSwiping(false);
    }
  }, [uc, userId, swiping, liked]);

  return {
    profile,
    loading,
    error,
    reload: load,
    like,
    swiping,
    liked,
    match,
    startChat,
    openingChat,
    dismissMatch: () => setMatch(null),
  };
}
