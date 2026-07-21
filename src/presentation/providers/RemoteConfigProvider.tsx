import React, { createContext, useContext, useEffect, useState } from 'react';
import { env } from '@/core/config/env';
import {
  emptyInstallConfig,
  parseInstallConfig,
  type InstallConfig,
} from '@/core/config/installConfig';
import {
  defaultInterestsCatalog,
  parseInterestsCatalog,
  type InterestItem,
} from '@/core/config/interestsCatalog';

/**
 * پیکربندیِ زمانِ اجرا که یک‌بار از `GET /api/config` خوانده و در کلِ اپ به اشتراک
 * گذاشته می‌شود (روش‌های نصب، کاتالوگِ علاقه‌مندی‌ها و سوییچ‌های مربوط). شکست‌خوردنِ
 * درخواست fail-safe است: `install` روی مقدارِ خالی و `interests` روی فهرستِ
 * پیش‌فرضِ داخلی می‌ماند و هیچ‌چیز مسدود نمی‌شود.
 */
interface RemoteConfigValue {
  install: InstallConfig;
  interests: InterestItem[];
  loaded: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigValue>({
  install: emptyInstallConfig,
  interests: defaultInterestsCatalog,
  loaded: false,
});

export const useRemoteConfig = () => useContext(RemoteConfigContext);

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [install, setInstall] = useState<InstallConfig>(emptyInstallConfig);
  const [interests, setInterests] = useState<InterestItem[]>(defaultInterestsCatalog);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/api/config`);
        if (!res.ok) return;
        const cfg = (await res.json()) as { install?: unknown; interests?: unknown };
        if (!alive) return;
        setInstall(parseInstallConfig(cfg.install));
        setInterests(parseInterestsCatalog(cfg.interests));
      } catch {
        /* fail-safe: مقدارِ پیش‌فرض می‌ماند */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RemoteConfigContext.Provider value={{ install, interests, loaded }}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
