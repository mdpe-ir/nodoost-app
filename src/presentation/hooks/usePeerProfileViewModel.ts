import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { PeerProfile, MatchResult } from '@/domain/entities';

type MySwipe = 'like' | 'super' | 'nope' | undefined;

/** ویومدلِ پروفایلِ عمومیِ یک کاربرِ دیگر: بارگذاری + پسند/رد + پس‌گرفتنِ کنش. */
export function usePeerProfileViewModel(userId: number) {
  const uc = useCases();
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [swiping, setSwiping] = useState(false);
  /** کنشِ فعلیِ من روی این کاربر — از سرور می‌آید و با هر کنش به‌روز می‌شود. */
  const [mySwipe, setMySwipe] = useState<MySwipe>(undefined);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const p = await uc.discovery.getPeerProfile(userId);
      setProfile(p);
      setMySwipe(p.mySwipe);
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
  }, [profile, uc, userId]);

  const like = useCallback(async () => {
    if (swiping || mySwipe === 'like' || mySwipe === 'super') return;
    setSwiping(true);
    try {
      const r = await uc.discovery.swipe(userId, 'like');
      setMySwipe('like');
      if (r.matchId) {
        setMatch(r);
        setProfile((p) => (p ? { ...p, isMatch: true, matchId: r.matchId } : p));
      }
    } catch {
      /* نادیده */
    } finally {
      setSwiping(false);
    }
  }, [uc, userId, swiping, mySwipe]);

  /** «نپسندیدن» — کاربر از پیشنهادهای بعدی کنار می‌رود. */
  const dislike = useCallback(async () => {
    if (swiping || mySwipe === 'nope') return;
    setSwiping(true);
    try {
      await uc.discovery.swipe(userId, 'pass');
      setMySwipe('nope');
    } catch {
      /* نادیده */
    } finally {
      setSwiping(false);
    }
  }, [uc, userId, swiping, mySwipe]);

  /** پس‌گرفتنِ کنشِ قبلی؛ اگر مچ شده باشند سرور اجازه نمی‌دهد. */
  const undoSwipe = useCallback(async () => {
    if (swiping || !mySwipe) return;
    setSwiping(true);
    try {
      await uc.discovery.unswipe(userId);
      setMySwipe(undefined);
    } catch {
      /* نادیده */
    } finally {
      setSwiping(false);
    }
  }, [uc, userId, swiping, mySwipe]);

  /**
   * دنبال/لغوِ دنبال — خوش‌بینانه و **رایگان برای همه‌ی سطح‌ها** (هیچ دروازه‌ی
   * اشتراکی این‌جا نیست). شمارنده‌ها با پاسخِ سرور هم‌گام می‌شوند.
   */
  const [followBusy, setFollowBusy] = useState(false);
  const toggleFollow = useCallback(async () => {
    if (followBusy || !profile) return;
    const next = !profile.isFollowing;
    setFollowBusy(true);
    setProfile((p) =>
      p
        ? {
            ...p,
            isFollowing: next,
            followersCount: Math.max(0, p.followersCount + (next ? 1 : -1)),
          }
        : p
    );
    try {
      const state = next ? await uc.follow.follow(userId) : await uc.follow.unfollow(userId);
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: state.isFollowing,
              isFollowedBy: state.isFollowedBy,
              followersCount: state.followersCount,
              followingCount: state.followingCount,
            }
          : p
      );
    } catch {
      // برگرداندنِ حالتِ خوش‌بینانه
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: !next,
              followersCount: Math.max(0, p.followersCount + (next ? -1 : 1)),
            }
          : p
      );
    } finally {
      setFollowBusy(false);
    }
  }, [followBusy, profile, uc, userId]);

  const reportPhoto = useCallback(async (photoId: number | undefined, reason: string) => {
    if (reporting) return false;
    setReporting(true);
    try {
      await uc.safety.report(userId, reason, photoId);
      setReported(true);
      return true;
    } catch {
      return false;
    } finally {
      setReporting(false);
    }
  }, [reporting, uc, userId]);

  return {
    profile,
    loading,
    error,
    reload: load,
    like,
    dislike,
    undoSwipe,
    swiping,
    mySwipe,
    liked: mySwipe === 'like' || mySwipe === 'super',
    disliked: mySwipe === 'nope',
    match,
    startChat,
    openingChat,
    toggleFollow,
    followBusy,
    reportPhoto,
    reporting,
    reported,
    dismissMatch: () => setMatch(null),
  };
}
