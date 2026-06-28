import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { User, AuthResult } from '@/domain/entities';

type Status = 'loading' | 'authed' | 'guest';

interface SessionValue {
  status: Status;
  user: User | null;
  login: (phone: string, code: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/** وضعیتِ نشست و کاربرِ جاری را نگه می‌دارد و در کلِ اپ در دسترس می‌گذارد. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await uc.profile.getMe();
      setUser(me);
      setStatus('authed');
    } catch {
      setUser(null);
      setStatus('guest');
    }
  }, [uc]);

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
    setUser(null);
    setStatus('guest');
  }, [uc]);

  return (
    <SessionContext.Provider value={{ status, user, login, logout, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
