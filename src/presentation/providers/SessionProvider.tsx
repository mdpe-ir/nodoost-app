import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import { restorePurchases } from '@/core/billing/restorePurchases';
import { flushPendingReceipts } from '@/core/billing/pendingReceipts';
import { flushPendingConsumes } from '@/core/billing/pendingConsumes';
import { recordReviewMoment } from '@/core/reviewMoments';
import type { AccountMeta, User, AuthResult } from '@/domain/entities';

type Status = 'loading' | 'authed' | 'guest';

interface SessionValue {
  status: Status;
  user: User | null;
  /** اکانت‌های واردشده روی همین دستگاه، به ترتیبِ افزودن. */
  accounts: AccountMeta[];
  /** شناسه‌ی اکانتِ فعال؛ `null` یعنی مهمان. */
  activeId: string | null;
  /** در حالِ جابه‌جایی بین اکانتها — برای پوشاندنِ بازسازیِ درختِ داده. */
  switching: boolean;
  /** ورود یا افزودنِ اکانت — یک مسیر و یک پیاده‌سازی، چون سرور فرقی نمی‌گذارد. */
  login: (phone: string, code: string) => Promise<AuthResult>;
  addAccount: (phone: string, code: string) => Promise<AuthResult>;
  switchAccount: (id: string) => Promise<void>;
  /** خروج از اکانتِ فعال؛ اگر اکانتِ دیگری بماند همان فعال می‌شود. */
  logout: () => Promise<void>;
  /** خروج از یک اکانتِ مشخص (کارتِ برگه‌ی سوییچ). */
  logoutAccount: (id: string) => Promise<void>;
  /** خروج از همه — برای «فراموشیِ رمز» و پاک‌سازیِ کامل. */
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  reloadAccounts: () => Promise<void>;
  /** سطحی که تازه فعال شده و باید برایش پیامِ تبریک نشان داده شود (یا null). */
  celebrateTier: number | null;
  dismissCelebration: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** خطای ۴۰۱ یعنی نشستِ این اکانت مرده است؛ بقیه‌ی خطاها (شبکه) یعنی «الان نه». */
const isSessionDead = (e: unknown): boolean => e instanceof ApiError && e.isAuth;

/**
 * وضعیتِ نشست، فهرستِ اکانت‌های دستگاه و کاربرِ جاری را نگه می‌دارد.
 *
 * چنداکانتی این‌جا متمرکز است و نه در یک پرووایدرِ جداگانه: «کاربرِ جاری» و
 * «فهرستِ اکانت‌ها» دو منبعِ حقیقتِ تفکیک‌ناپذیرند — هر سوییچی هر دو را با هم
 * عوض می‌کند. دو پرووایدر فقط دو جا برای ناهم‌خوانی می‌ساخت.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<AccountMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [celebrateTier, setCelebrateTier] = useState<number | null>(null);
  /** آخرین سطحِ شناخته‌شده — برای تشخیصِ «تازه ارتقا یافت» بدونِ جشنِ اشتباه در بارگذاریِ اول. */
  const prevTierRef = useRef<number | null>(null);
  /** آینه‌ی همگامِ اکانتِ فعال — refreshUser نباید منتظرِ رندرِ بعدی بماند. */
  const activeIdRef = useRef<string | null>(null);
  /**
   * اگر نشستِ اکانتی مرده باشد، یک بار دورِ تازه‌ی راه‌اندازی می‌خواهیم تا
   * اکانتِ جانشین امتحان شود. افزایشِ این شمارنده اثر را دوباره اجرا میکند.
   */
  const [bootToken, setBootToken] = useState(0);

  const reloadAccounts = useCallback(async () => {
    const [list, active] = await Promise.all([
      uc.auth.listAccounts(),
      uc.auth.getActiveAccountId(),
    ]);
    setAccounts(list);
    setActiveId(active);
    activeIdRef.current = active;
  }, [uc]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await uc.profile.getMe();
      if (prevTierRef.current != null && me.isPlus && me.tier > prevTierRef.current) {
        setCelebrateTier(me.tier);
      }
      prevTierRef.current = me.tier;
      setUser(me);
      setStatus('authed');
      // نام/آواتار در ایندکسِ اکانت هم می‌نشیند تا برگه‌ی سوییچ بدونِ انتظار پر باشد
      // و آفلاین هم چهره‌ی درست را نشان دهد.
      const id = activeIdRef.current;
      if (id) {
        const primary = me.photos?.find((p) => p.isPrimary) ?? me.photos?.[0];
        await uc.auth.updateAccountMeta(id, {
          name: me.name,
          photoUrl: primary?.url,
          status: me.status,
          phone: me.phone,
        });
        await reloadAccounts();
      }
    } catch (e) {
      prevTierRef.current = null;
      setUser(null);
      if (isSessionDead(e)) {
        // توکنِ این اکانت دیگر اعتبار ندارد: از دستگاه بردار و اکانتِ بعدی را
        // امتحان کن. بدونِ این کار، یک اکانتِ مرده کلِ اپ را روی صفحه‌ی ورود
        // نگه می‌داشت در حالی که اکانت‌های سالمِ دیگری روی دستگاه بودند.
        const dead = activeIdRef.current;
        if (dead) await uc.auth.logoutAccount(dead);
        await reloadAccounts();
        if (activeIdRef.current) {
          setBootToken((t) => t + 1);
          return;
        }
      }
      setStatus('guest');
    }
  }, [uc, reloadAccounts]);

  // راه‌اندازی: اکانتِ فعال را از حافظه می‌خواند و کاربرش را می‌گیرد.
  // `bootToken` اجازه می‌دهد پس از مرگِ نشستِ یک اکانت یک دورِ تازه اجرا شود.
  useEffect(() => {
    let alive = true;
    (async () => {
      await reloadAccounts();
      if (!alive) return;
      const id = await uc.auth.getActiveAccountId();
      if (!alive) return;
      activeIdRef.current = id;
      if (id) await refreshUser();
      else setStatus('guest');
    })();
    return () => {
      alive = false;
    };
  }, [uc, reloadAccounts, refreshUser, bootToken]);

  // بستنِ تبریکِ خرید قوی‌ترین «لحظه‌ی خوش» است — کاربری که همین حالا پول
  // داده و امکاناتش باز شده. ReviewPromptProvider منتظرِ همین سیگنال است.
  const dismissCelebration = useCallback(() => {
    setCelebrateTier(null);
    recordReviewMoment('purchase');
  }, []);

  // بازیابیِ خریدهای گم‌شده: هر بار که نشستِ معتبر داریم و هر بار که اپ از پس‌زمینه
  // برمی‌گردد، سه صف خالی می‌شوند. ترتیبشان معنا دارد.
  //
  // ۱) صفِ محلیِ رسیدها — رسیدِ امضاشده‌ای که خریدش انجام شده ولی تأییدِ سرور
  //    نگرفته. به هیچ APIی از بازار وابسته نیست، پس همیشه کار می‌کند. اول می‌آید
  //    چون هر رسیدی که این‌جا پذیرفته شود، خودش یک ردیفِ تازه به صفِ مصرف می‌دهد.
  // ۲) صفِ مصرف — توکن‌هایی که سرور ثبتشان کرده ولی بازار هنوز «مصرف‌شده»
  //    نمی‌داندشان. تا این خالی نشود، تمدیدِ ماهِ بعدِ همان SKU با
  //    ITEM_ALREADY_OWNED رد می‌شود. این تنها جایی است که با اتصالِ آرام و
  //    باکیفیت اجرا می‌شود — برخلافِ لحظه‌ی برگشت از صفحه‌ی پرداخت.
  // ۳) صفِ خودِ بازار (`getPurchasedProducts`) — پوششِ حالتِ «اپ پاک/عوض شد».
  //    در تولید این فراخوانی روی دستگاهِ کاربران رد میشود، پس دیگر تنها امیدِ
  //    بازیابی نیست؛ ولی برای دستگاه‌هایی که جواب می‌دهد نگه داشته شده.
  //
  // اگر چیزی واقعاً فعال شود، refreshUser بالا رفتنِ سطح را می‌بیند و همان پنجره‌ی
  // تبریکِ همیشگی را نشان می‌دهد.
  useEffect(() => {
    if (status !== 'authed') return;

    let alive = true;
    const sweep = async (trigger: string) => {
      const pending = await flushPendingReceipts({
        verify: uc.catalog.verifyBazaarPurchase,
      });
      const consumes = await flushPendingConsumes();
      // نرخِ واقعیِ consume تا امروز نامعلوم بود، چون فقط شکست‌ها گزارش می‌شدند و
      // فقط در بدترین لحظه. این beacon موفقیت را هم می‌فرستد تا معلوم شود
      // «مصرفِ به‌تعویق‌افتاده» واقعاً مشکل را حل کرده یا نه.
      if (consumes.consumed > 0 || consumes.kept > 0) {
        uc.catalog
          .reportBazaarSweep({
            trigger: 'consume-queue',
            connect_ok: consumes.consumed > 0 || consumes.errors.length === 0,
            owned: consumes.consumed + consumes.kept,
            consumed: consumes.consumed,
            failed: consumes.kept,
            errors: consumes.errors,
          })
          .catch(() => {});
      }
      const s = await restorePurchases(
        { restore: uc.catalog.restoreBazaarPurchase, report: uc.catalog.reportBazaarSweep },
        trigger
      );
      if (alive && (s.restored > 0 || pending.accepted > 0)) await refreshUser();
    };
    sweep('launch');

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') sweep('foreground');
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, [status, uc, refreshUser]);

  const login = useCallback(
    async (phone: string, code: string) => {
      const result = await uc.auth.verifyOtp(phone, code);
      await reloadAccounts();
      activeIdRef.current = await uc.auth.getActiveAccountId();
      prevTierRef.current = null;
      await refreshUser();
      return result;
    },
    [uc, reloadAccounts, refreshUser]
  );

  /** افزودنِ اکانت همان ورود است — عمداً یک پیاده‌سازی، تا دو رفتارِ واگرا نسازیم. */
  const addAccount = useCallback((phone: string, code: string) => login(phone, code), [login]);

  const switchAccount = useCallback(
    async (id: string) => {
      if (activeIdRef.current === id) return;
      setSwitching(true);
      try {
        // سطحِ قبلی نباید جشنِ اشتباه بسازد؛ اکانتِ تازه از صفر شمرده می‌شود.
        prevTierRef.current = null;
        await uc.auth.switchAccount(id);
        activeIdRef.current = id;
        await reloadAccounts();
        await refreshUser();
      } finally {
        setSwitching(false);
      }
    },
    [uc, reloadAccounts, refreshUser]
  );

  const logout = useCallback(async () => {
    await uc.auth.logout();
    prevTierRef.current = null;
    setCelebrateTier(null);
    const next = await uc.auth.getActiveAccountId();
    await reloadAccounts();
    activeIdRef.current = next;
    if (next) await refreshUser();
    else {
      setUser(null);
      setStatus('guest');
    }
  }, [uc, reloadAccounts, refreshUser]);

  const logoutAccount = useCallback(
    async (id: string) => {
      if (id === activeIdRef.current) return logout();
      await uc.auth.logoutAccount(id);
      await reloadAccounts();
    },
    [uc, logout, reloadAccounts]
  );

  const logoutAll = useCallback(async () => {
    await uc.auth.logoutAll();
    prevTierRef.current = null;
    setCelebrateTier(null);
    setUser(null);
    setAccounts([]);
    setActiveId(null);
    activeIdRef.current = null;
    setStatus('guest');
  }, [uc]);

  return (
    <SessionContext.Provider
      value={{
        status,
        user,
        accounts,
        activeId,
        switching,
        login,
        addAccount,
        switchAccount,
        logout,
        logoutAccount,
        logoutAll,
        refreshUser,
        reloadAccounts,
        celebrateTier,
        dismissCelebration,
      }}
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
