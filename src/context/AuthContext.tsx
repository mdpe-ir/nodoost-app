import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAccess, setTokens, clearTokens } from '@/api/client';
import { Profile } from '@/api/nodoost';
import type { Me } from '@/types';

interface AuthState {
  loading: boolean;
  me: Me | null;
  setSession: (access: string, refresh?: string) => Promise<Me | null>;
  refreshMe: () => Promise<Me | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      const data = await Profile.me();
      setMe(data);
      return data;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getAccess();
      if (token) await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const setSession = useCallback(
    async (access: string, refresh?: string) => {
      await setTokens(access, refresh);
      return refreshMe();
    },
    [refreshMe]
  );

  const signOut = useCallback(async () => {
    await clearTokens();
    setMe(null);
  }, []);

  return (
    <Ctx.Provider value={{ loading, me, setSession, refreshMe, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
