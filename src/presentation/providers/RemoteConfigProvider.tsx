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
import { defaultTierRules, parseTierRules, type TierRules } from '@/core/config/tierRules';
import {
  emptyReviewConfig,
  parseReviewConfig,
  type ReviewConfig,
} from '@/core/config/reviewConfig';
import {
  emptyMissionsConfig,
  parseMissionsConfig,
  type MissionsConfig,
} from '@/core/config/missionsConfig';
import {
  emptyChatConfig,
  parseChatConfig,
  type ChatConfig,
} from '@/core/config/chatConfig';
import {
  emptyGenderFilter,
  parseGenderFilter,
  type GenderFilterGate,
} from '@/core/config/genderFilter';
import {
  defaultAccountsConfig,
  parseAccountsConfig,
  type AccountsConfig,
} from '@/core/config/accountsConfig';
import {
  defaultAppLockConfig,
  parseAppLockConfig,
  type AppLockConfig,
} from '@/core/config/appLockConfig';

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
  /** سقف‌های سطحِ رایگان — ستونِ «عادی» در جدولِ مقایسه از این‌جا ساخته می‌شود. */
  rules: TierRules;
  /** متن‌ها و سوییچِ درخواستِ ثبتِ نظر در کافه‌بازار. */
  review: ReviewConfig;
  /** پرچم‌های سیستمِ امتیاز و نردبانِ رتبه. */
  missions: MissionsConfig;
  /** دروازه‌های پیامِ صوتی/عکس در گفتگو. */
  chat: ChatConfig;
  /** دروازهی فیلترِ جنسیت در کاوش و چهره‌نما. */
  genderFilter: GenderFilterGate;
  /** سقفِ تعدادِ اکانت روی یک دستگاه — برگه‌ی سوییچ و صفحه‌ی «حسابها». */
  accounts: AccountsConfig;
  /** دروازه‌ی قفلِ برنامه (عددی/الگو). */
  appLock: AppLockConfig;
  loaded: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigValue>({
  install: emptyInstallConfig,
  interests: defaultInterestsCatalog,
  version: emptyVersionConfig,
  rules: defaultTierRules,
  review: emptyReviewConfig,
  missions: emptyMissionsConfig,
  chat: emptyChatConfig(),
  genderFilter: emptyGenderFilter(),
  accounts: defaultAccountsConfig(),
  appLock: defaultAppLockConfig(),
  loaded: false,
});

export const useRemoteConfig = () => useContext(RemoteConfigContext);

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [install, setInstall] = useState<InstallConfig>(emptyInstallConfig);
  const [interests, setInterests] = useState<InterestItem[]>(defaultInterestsCatalog);
  const [version, setVersion] = useState<VersionConfig>(emptyVersionConfig);
  const [rules, setRules] = useState<TierRules>(defaultTierRules);
  const [review, setReview] = useState<ReviewConfig>(emptyReviewConfig);
  const [missions, setMissions] = useState<MissionsConfig>(emptyMissionsConfig);
  const [chat, setChat] = useState<ChatConfig>(emptyChatConfig());
  const [genderFilter, setGenderFilter] = useState<GenderFilterGate>(emptyGenderFilter());
  const [accounts, setAccounts] = useState<AccountsConfig>(defaultAccountsConfig());
  const [appLock, setAppLock] = useState<AppLockConfig>(defaultAppLockConfig());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/api/config`);
        if (!res.ok) return;
        const cfg = (await res.json()) as {
          install?: unknown;
          interests?: unknown;
          rules?: unknown;
          review?: unknown;
          missions?: unknown;
          chat?: unknown;
          gender_filter?: unknown;
          accounts?: unknown;
          app_lock?: unknown;
        };
        if (!alive) return;
        setInstall(parseInstallConfig(cfg.install));
        setInterests(parseInterestsCatalog(cfg.interests));
        setRules(parseTierRules(cfg.rules));
        setReview(parseReviewConfig(cfg.review));
        setMissions(parseMissionsConfig(cfg.missions));
        setChat(parseChatConfig(cfg.chat));
        setGenderFilter(parseGenderFilter(cfg.gender_filter));
        setAccounts(parseAccountsConfig(cfg.accounts));
        setAppLock(parseAppLockConfig(cfg.app_lock));
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
    <RemoteConfigContext.Provider
      value={{ install, interests, version, rules, review, missions, chat, genderFilter, accounts, appLock, loaded }}
    >
      {children}
    </RemoteConfigContext.Provider>
  );
}
