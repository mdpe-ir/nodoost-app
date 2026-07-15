import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { User, AuthResult } from '@/domain/entities';

type Status = 'loading' | 'authed' | 'guest';

interface SessionValue {
  status: Status;
  user: User | null;
  login: (phone: string, code: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** سطحی که تازه فعال شده و باید برایش پیامِ تبریک نشان داده شود (یا null). */
  celebrateTier: number | null;
  /** بستنِ پنجره‌ی تبریکِ فعال‌سازیِ اشتراک. */
  dismissCelebration: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** وضعیتِ نشست و کاربرِ جاری را نگه می‌دارد و در کلِ اپ در دسترس می‌گذارد. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [celebrateTier, setCelebrateTier] = useState<number | null>(null);
  // آخرین سطحِ شناخته‌شده — برای تشخیصِ «تازه ارتقا یافت» بدونِ جشنِ اشتباه در بارگذاریِ اول.
  const prevTierRef = useRef<number | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await uc.profile.getMe();
      // اگر سطح از یک مقدارِ شناخته‌شده‌ی پایین‌تر بالا رفته باشد (خرید/فعال‌سازی)، تبریک نشان بده.
      if (prevTierRef.current != null && me.isPlus && me.tier > prevTierRef.current) {
        setCelebrateTier(me.tier);
      }
      prevTierRef.current = me.tier;
      setUser(me);
      setStatus('authed');
    } catch {
      prevTierRef.current = null;
      setUser(null);
      setStatus('guest');
    }
  }, [uc]);

  const dismissCelebration = useCallback(() => setCelebrateTier(null), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const hasSession = await uc.auth.hasSession();
      if (!alive) return;
      if (hasSession) await refreshUser();
      else setStatus('guest');
    })();
    return () => {
      alive = false;
    };
  }, [uc, refreshUser]);

  const login = useCallback(
    async (phone: string, code: string) => {
      const result = await uc.auth.verifyOtp(phone, code);
      await refreshUser();
      return result;
    },
    [uc, refreshUser]
  );

  const logout = useCallback(async () => {
    await uc.auth.logout();
    prevTierRef.current = null;
    setCelebrateTier(null);
    setUser(null);
    setStatus('guest');
  }, [uc]);

  return (
    <SessionContext.Provider
      value={{ status, user, login, logout, refreshUser, celebrateTier, dismissCelebration }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
