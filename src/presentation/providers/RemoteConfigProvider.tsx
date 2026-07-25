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
import {
  emptyVersionConfig,
  parseVersionConfig,
  type VersionConfig,
} from '@/core/config/appUpdate';

/**
 * پیکربندیِ زمانِ اجرا که یک‌بار از `GET /api/config` خوانده و در کلِ اپ به اشتراک
 * گذاشته می‌شود (روش‌های نصب، کاتالوگِ علاقه‌مندی‌ها و سوییچ‌های مربوط). شکست‌خوردنِ
 * درخواست fail-safe است: `install` روی مقدارِ خالی و `interests` روی فهرستِ
 * پیش‌فرضِ داخلی می‌ماند و هیچ‌چیز مسدود نمی‌شود.
 */
interface RemoteConfigValue {
  install: InstallConfig;
  interests: InterestItem[];
  version: VersionConfig;
  loaded: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigValue>({
  install: emptyInstallConfig,
  interests: defaultInterestsCatalog,
  version: emptyVersionConfig,
  loaded: false,
});

export const useRemoteConfig = () => useContext(RemoteConfigContext);

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [install, setInstall] = useState<InstallConfig>(emptyInstallConfig);
  const [interests, setInterests] = useState<InterestItem[]>(defaultInterestsCatalog);
  const [version, setVersion] = useState<VersionConfig>(emptyVersionConfig);
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
        // فیلدهای نسخه در ریشه‌ی پاسخ‌اند (نه زیرِ install)، پس کلِ cfg را می‌دهیم.
        setVersion(parseVersionConfig(cfg));
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
    <RemoteConfigContext.Provider value={{ install, interests, version, loaded }}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
