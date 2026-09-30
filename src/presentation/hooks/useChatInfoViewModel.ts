import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from './useRefetchOnFocus';
import type { PeerProfile, Presence, SharedMediaPage } from '@/domain/entities';

/**
 * ویومدلِ «اطلاعاتِ مخاطب» — همان چیزی که تلگرام با تپ روی هدرِ گفتگو باز
 * می‌کند: حضورِ لحظه‌ای، پروفایلِ اجتماعی، مدیای اشتراکی، و کنش‌های گفتگو
 * (دنبال‌کردن، پاک‌کردنِ تاریخچه، مسدودسازی، گزارش).
 *
 * پروفایل و حضور موازی گرفته می‌شوند و هر کدام مستقل شکست می‌خورند: نبودِ
 * پروفایل (کاربرِ حذف‌شده) نباید کنش‌های گفتگو را از کاربر بگیرد.
 */
export function useChatInfoViewModel(matchId: number, peerId?: number) {
  const uc = useCases();
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
  /** پیشنمایشِ مدیای اشتراکی — ۳ عکسِ آخر + شمارنده‌های کل. */
  const [shared, setShared] = useState<SharedMediaPage | null>(null);
  const [loading, setLoading] = useState(!!peerId);
  const [error, setError] = useState(false);

  const [followBusy, setFollowBusy] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [reported, setReported] = useState(false);
  /**
   * وضعیتِ بیصدای همین گفتگو — مثلِ تِرِد جدا از حضور خوانده می‌شود و
   * خوشبینانه تگل می‌شود تا چیپ و ردیفِ تنظیمات بی‌درنگ جواب بدهند.
   */
  const [muted, setMuted] = useState(false);
  const [muteBusy, setMuteBusy] = useState(false);

  /**
   * بارگذاری. عمداً هیچ `setState`ِ همگامِ ابتدایی ندارد: حالتِ `loading` از پیش
   * با مقدارِ درست (`!!peerId`) ساخته می‌شود، پس فراخوانی از دلِ افکت رندرِ
   * آبشاریِ اضافه نمی‌سازد (قاعده‌ی `set-state-in-effect`).
   */
  const load = useCallback(async () => {
    const [pres, prof, med, st] = await Promise.all([
      matchId ? uc.chat.getPresence(matchId).catch(() => null) : Promise.resolve(null),
      peerId ? uc.discovery.getPeerProfile(peerId).catch(() => null) : Promise.resolve(null),
      // پیشنمایشِ مدیا: فقط ۳ تا می‌خواهیم؛ شمارنده‌ها در همان پاسخ می‌آیند.
      matchId
        ? uc.chat.getSharedMedia(matchId, 'photo', { limit: 3 }).catch(() => null)
        : Promise.resolve(null),
      // وضعیتِ بیصدا/سنجاقِ سبک هنگامِ ورود — مثلِ همان درخواستی که تِرِد می‌زند.
      matchId ? uc.chat.getThreadState(matchId).catch(() => null) : Promise.resolve(null),
    ]);
    setPresence(pres);
    if (prof) setProfile(prof);
    if (med) setShared(med);
    if (st) setMuted(st.muted);
    // پروفایل خواسته شده ولی نیامده ⇒ خطا. اگر peerId نباشد، چیزی نخواسته‌ایم.
    setError(!!peerId && !prof);
    setLoading(false);
  }, [uc, matchId, peerId]);

  useEffect(() => {
    // اینجا `setState`ِ همگامی وجود ندارد: همه‌ی به‌روزرسانی‌ها داخلِ `load` و
    // بعد از `await` اجرا می‌شوند. قاعده برای توابعِ async محافظه‌کارانه عمل
    // می‌کند و همین را ایراد می‌گیرد؛ بارگذاریِ داده در افکت دقیقاً همان کاری
    // است که افکت برایش ساخته شده.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  /** تلاشِ دوباره با اسکلت — کنشِ صریحِ کاربر، نه افکت. */
  const reload = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  useRefetchOnFocus(load);

  /** دنبال/لغوِ دنبال — خوش‌بینانه، با برگرداندنِ حالت در صورتِ خطا. */
  const toggleFollow = useCallback(async () => {
    if (followBusy || !profile || !peerId) return;
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
      const state = next ? await uc.follow.follow(peerId) : await uc.follow.unfollow(peerId);
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
  }, [followBusy, profile, peerId, uc]);

  /**
   * بی‌صدا/باصدا — خوش‌بینانه با برگرداندن‌ی حالت در صورت‌ی خطا
   * (همان الگوی `toggleFollow`): کاربر نباید منتظر شبکه بماند.
   */
  const toggleMute = useCallback(async () => {
    if (muteBusy) return;
    const next = !muted;
    setMuteBusy(true);
    setMuted(next);
    try {
      await uc.chat.setThreadMuted(matchId, next);
    } catch {
      setMuted(!next);
    } finally {
      setMuteBusy(false);
    }
  }, [muteBusy, muted, matchId, uc]);

  /** پاک‌کردنِ تاریخچه فقط از سمتِ خودم؛ طرفِ مقابل چیزی نمی‌فهمد. */
  const clearChat = useCallback(async (): Promise<boolean> => {
    if (clearing) return false;
    setClearing(true);
    try {
      await uc.chat.clearChat(matchId);
      return true;
    } catch {
      return false;
    } finally {
      setClearing(false);
    }
  }, [clearing, matchId, uc]);

  const block = useCallback(async (): Promise<boolean> => {
    if (blocking || !peerId) return false;
    setBlocking(true);
    try {
      await uc.safety.block(peerId);
      return true;
    } catch {
      return false;
    } finally {
      setBlocking(false);
    }
  }, [blocking, peerId, uc]);

  /**
   * گزارش. `messageId` اختیاری است و از دلِ گفتگو (منوی پیام) می‌آید؛ این‌جا
   * بدونِ آن، خودِ کاربر گزارش می‌شود.
   */
  const report = useCallback(
    async (reason: string, messageId?: number): Promise<boolean> => {
      if (reporting || !peerId) return false;
      setReporting(true);
      setReportError(false);
      try {
        await uc.safety.report(peerId, reason, undefined, messageId);
        setReported(true);
        return true;
      } catch {
        setReportError(true);
        return false;
      } finally {
        setReporting(false);
      }
    },
    [reporting, peerId, uc]
  );

  return {
    profile,
    presence,
    shared,
    loading,
    error,
    reload,
    toggleFollow,
    followBusy,
    clearChat,
    clearing,
    block,
    blocking,
    report,
    reporting,
    reportError,
    reported,
    muted,
    muteBusy,
    toggleMute,
  };
}
