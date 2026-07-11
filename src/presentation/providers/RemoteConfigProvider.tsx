import React, { createContext, useContext, useEffect, useState } from 'react';
import { env } from '@/core/config/env';
import {
  emptyInstallConfig,
  parseInstallConfig,
  type InstallConfig,
} from '@/core/config/installConfig';

/**
 * پیکربندیِ زمانِ اجرا که یک‌بار از `GET /api/config` خوانده و در کلِ اپ به اشتراک
 * گذاشته می‌شود (روش‌های نصب و سوییچ‌های مربوط). شکست‌خوردنِ درخواست fail-safe است:
 * `install` روی مقدارِ خالی می‌ماند و هیچ‌چیز مسدود نمی‌شود.
 */
interface RemoteConfigValue {
  install: InstallConfig;
  loaded: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigValue>({
  install: emptyInstallConfig,
  loaded: false,
});

export const useRemoteConfig = () => useContext(RemoteConfigContext);

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [install, setInstall] = useState<InstallConfig>(emptyInstallConfig);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/api/config`);
        if (!res.ok) return;
        const cfg = (await res.json()) as { install?: unknown };
        if (!alive) return;
        setInstall(parseInstallConfig(cfg.install));
      } catch {
        /* fail-safe: مقدارِ خالی می‌ماند */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RemoteConfigContext.Provider value={{ install, loaded }}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
