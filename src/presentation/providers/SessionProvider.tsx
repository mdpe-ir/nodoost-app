import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { restorePurchases } from '@/core/billing/restorePurchases';
import { flushPendingReceipts } from '@/core/billing/pendingReceipts';
import { flushPendingConsumes } from '@/core/billing/pendingConsumes';
import { recordReviewMoment } from '@/core/reviewMoments';
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

  // بستنِ تبریکِ خرید قوی‌ترین «لحظه‌ی خوش» است — کاربری که همین حالا پول
  // داده و امکاناتش باز شده. ReviewPromptProvider منتظرِ همین سیگنال است.
  const dismissCelebration = useCallback(() => {
    setCelebrateTier(null);
    recordReviewMoment('purchase');
  }, []);

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
  //    در تولید این فراخوانی روی دستگاهِ کاربران رد می‌شود، پس دیگر تنها امیدِ
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
