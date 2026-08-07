import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Quota, QuotaKey } from '@/domain/entities';

/**
 * سهمیه‌ی کاربر را یک‌جا نگه می‌دارد تا کاوش، شانسی، گفتگو و پروفایل همگی یک
 * عدد را نشان دهند. الگویش عمداً همان BadgesProvider است.
 *
 * چرا provider و نه هوکِ هر صفحه: عددِ سهمیه باید *بلافاصله* بعد از مصرف در
 * همه‌ی صفحه‌ها عوض شود. با هوکِ محلی، کاربر بعد از لایک در کاوش، در پروفایل
 * عددِ کهنه می‌دید — و بی‌اعتمادی به شمارنده بدتر از نداشتنش است.
 */

interface QuotaValue {
  quota: Quota | null;
  loading: boolean;
  /** از سرور بگیر (بعد از خرید، ورود به صفحه‌ی حساس، بازگشت از پس‌زمینه). */
  refresh: () => Promise<void>;
  /**
   * یک واحد از سهمیه را همین حالا کم می‌کند — پیش از رسیدنِ پاسخِ سرور، تا
   * شمارنده با کنشِ کاربر هم‌زمان حرکت کند. سرور همچنان منبعِ حقیقت است و
   * refreshِ بعدی عدد را تصحیح می‌کند.
   */
  consume: (key: QuotaKey) => void;
}

const QuotaContext = createContext<QuotaValue>({
  quota: null,
  loading: false,
  refresh: async () => {},
  consume: () => {},
});

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const { status, user } = useSession();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(false);
  const authed = status === 'authed';

  const refresh = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      setQuota(await uc.quota.get());
    } catch {
      /* fail-safe: عددِ قبلی می‌ماند؛ نبودِ سهمیه نباید صفحه‌ای را خراب کند */
    } finally {
      setLoading(false);
    }
  }, [uc, authed]);

  const consume = useCallback((key: QuotaKey) => {
    setQuota((q) => {
      if (!q) return q;
      return {
        ...q,
        items: q.items.map((i) =>
          i.key !== key || i.unlimited || i.remaining == null
            ? i
            : { ...i, used: i.used + 1, remaining: Math.max(0, i.remaining - 1) }
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (!authed) {
      setQuota(null);
      return;
    }
    refresh();
    // سطحِ کاربر که عوض شود (خرید/انقضا)، همه‌ی سقف‌ها عوض می‌شوند.
  }, [authed, user?.tier, refresh]);

  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = /inactive|background/.test(prev) && next === 'active';
      prev = next;
      // بازگشت از پس‌زمینه می‌تواند از مرزِ نیمه‌شب گذشته باشد — سهمیه‌ی روزانه تازه است.
      if (cameToForeground) refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({ quota: authed ? quota : null, loading, refresh, consume }),
    [authed, quota, loading, refresh, consume]
  );

  return <QuotaContext.Provider value={value}>{children}</QuotaContext.Provider>;
}

export const useQuota = (): QuotaValue => useContext(QuotaContext);
