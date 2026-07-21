import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Badges } from '@/domain/entities';

/** فاصله‌ی نظرخواهیِ شمارنده‌ها از سرور. */
const POLL_MS = 30_000;

const EMPTY: Badges = {
  notifications: 0,
  unreadNotifications: 0,
  unreadMessages: 0,
  unreadThreads: 0,
};

interface BadgesValue {
  badges: Badges;
  /** یک‌بار همین حالا از سرور بگیر (بعد از کنش‌هایی که شمارنده را عوض می‌کنند). */
  refresh: () => Promise<void>;
  /** نشانِ زنگوله را بدونِ رفت‌وبرگشت صفر می‌کند (بعد از «همه دیده شد»). */
  clearNotificationsBadge: () => void;
}

const BadgesContext = createContext<BadgesValue>({
  badges: EMPTY,
  refresh: async () => {},
  clearNotificationsBadge: () => {},
});

/**
 * شمارنده‌های نشان را یک‌جا نگه می‌دارد تا زنگوله‌ی هدر و نشانِ تبِ گفتگو از یک
 * منبع تغذیه شوند: هر ۳۰ ثانیه و با بازگشتِ اپ از پس‌زمینه تازه می‌شود.
 * فقط برای کاربرِ واردشده کار می‌کند و شکستِ درخواست fail-safe است (مقدارِ قبلی می‌ماند).
 */
export function BadgesProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const { status } = useSession();
  const [badges, setBadges] = useState<Badges>(EMPTY);
  const authed = status === 'authed';

  const refresh = useCallback(async () => {
    if (!authed) return;
    try {
      setBadges(await uc.notifications.getBadges());
    } catch {
      /* fail-safe: شمارنده‌ی قبلی می‌ماند */
    }
  }, [uc, authed]);

  const clearNotificationsBadge = useCallback(
    () => setBadges((b) => ({ ...b, notifications: 0 })),
    []
  );

  useEffect(() => {
    if (!authed) return;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [authed, refresh]);

  // بازگشتِ اپ به پیش‌زمینه — همان الگوی useRefetchOnFocus، ولی در سطحِ کلِ اپ.
  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = /inactive|background/.test(prev) && next === 'active';
      prev = next;
      if (cameToForeground) refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(
    // با خروج از حساب، نشانِ کاربرِ قبلی نباید دیده شود.
    () => ({ badges: authed ? badges : EMPTY, refresh, clearNotificationsBadge }),
    [authed, badges, refresh, clearNotificationsBadge]
  );

  return <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>;
}

export const useBadges = (): BadgesValue => useContext(BadgesContext);
