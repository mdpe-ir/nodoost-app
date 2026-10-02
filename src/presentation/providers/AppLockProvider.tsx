import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  generateSalt,
  hashSecret,
  patternToSecret,
  secretsMatch,
} from '@/core/security/passcode';
import {
  clearAppLockRecord,
  readAppLockRecord,
  writeAppLockRecord,
  type AppLockRecord,
  type AppLockType,
} from '@/core/storage/appLockStorage';
import { shouldAppLock } from '@/domain/policies/appLock';
import { authenticateBiometric } from '@/core/security/biometrics';
import { LockScreen } from '@/presentation/components/lock/LockScreen';
import { Loading } from '@/presentation/components/Loading';

interface AppLockValue {
  /** خواندنِ اولیهی رکورد تمام شده باشد. */
  ready: boolean;
  /** قفل تنظیم شده باشد (نوعش مهم نیست). */
  configured: boolean;
  /** نوعِ قفل تنظیمشده — یا null. */
  type: AppLockType | null;
  /** الان قفل باشد. */
  locked: boolean;
  /** تنظیمِ قفل با رازِ خام — هش و ذخیره اینجاست، نه در صفحهها. */
  configure: (type: AppLockType, secret: string) => Promise<void>;
  /**
   * بررسیِ راز؛ در صورتِ درستی قفل را باز میکند. پاسخِ بولی برای اینکه
   * صفحهها بدانند خطا نشان دهند یا نه — بازشدنِ قفل اینجاست، نه در صفحه.
   */
  verify: (secret: string) => Promise<boolean>;
  /** برداشتنِ قفل — اگر `force` سیاستِ ادمین اجازه دهد. */
  disable: () => Promise<void>;
  /** میانبرِ بیومتریک فعال باشد (و قفل هم تنظیم باشد). */
  biometricEnabled: boolean;
  /** روشن/خاموشکردنِ میانبرِ بیومتریک — فقط وقتی قفل تنظیم باشد. */
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  /**
   * درخواستِ احرازِ بیومتریک؛ در صورتِ موفقیت قفل را باز میکند. پاسخِ
   * `{success, cancelled}` است تا صفحه بداند انصرافِ کاربر را بی‌سروصدا رد کند.
   */
  unlockWithBiometrics: () => Promise<{ success: boolean; cancelled: boolean }>;
}

const AppLockContext = createContext<AppLockValue | null>(null);

/**
 * قفلِ برنامه — یک دروازهی سطحِ دستگاه، بالای همهی پرووایدرها.
 *
 * چرا اینجا و نه در SessionProvider: قفل به «اکانت» کاری ندارد؛ حتی وقتی
 * مهمان است یا در حالِ جابهجایی، صفحهی قفل باید بالای همهچیز بماند. رکوردش
 * هم در `appLockStorage` (سطحِ دستگاه) است نه `AccountStorage`.
 *
 * لحظهی قفلشدن: برگشتن از پسزمینه با عبور از سیاستِ `shouldAppLock`. خودِ
 * رفتن به پسزمینه قفل نمیکند (تصمیم در لحظهی برگشت گرفته میشود) تا مهلتِ
 * بخششِ آینده هم بدونِ تغییرِ ساختار قابلِ افزودن باشد.
 *
 * پوششِ قفل بهعنوان آخرین فرزند رندر میشود تا روی همهی برگهها، پاپآپها و
 * درختِ ناوبری بنشیند.
 */
export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<AppLockRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  /** آینهی رکورد برای هندلرِ AppState — بسته شدنِ listener را نمیخواهیم. */
  const recordRef = useRef<AppLockRecord | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);

  // خواندنِ اولیه از SecureStore ناهمگام است؛ setStateها بعد از یک await اجرا
  // میشوند، نه در بدنهی همگامِ افکت — الگویِ رایجِ «لودِ اولیه» در بقیهی
  // پرووایدرهای پروژه هم همین است.
  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await readAppLockRecord();
      if (!alive) return;
      recordRef.current = loaded;
      setRecord(loaded);
      setLocked(
        shouldAppLock({
          record: loaded,
          backgroundedAt: null,
          now: Date.now(),
        })
      );
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const hit = shouldAppLock({
          record: recordRef.current,
          backgroundedAt: backgroundedAtRef.current,
          now: Date.now(),
        });
        if (hit) setLocked(true);
        backgroundedAtRef.current = null;
        return;
      }
      // background یا inactive — هر دو «از دید خارج شد»اند؛ iOS اول inactive میشود.
      backgroundedAtRef.current = Date.now();
    });
    return () => sub.remove();
  }, []);

  const configure = useCallback(async (type: AppLockType, secret: string) => {
    const salt = await generateSalt();
    const hash = await hashSecret(secret, salt);
    const next: AppLockRecord = {
      type,
      salt,
      hash,
      length: secret.length,
      createdAt: Date.now(),
      // تنظیمِ تازهی رمز، میانبرِ قبلی را باطل میکند — بهتر از به ارث
      // ماندنش برای رازی که ممکن است عوض شده باشد.
      biometricEnabled: false,
    };
    await writeAppLockRecord(next);
    recordRef.current = next;
    setRecord(next);
    setLocked(false);
  }, []);

  const verify = useCallback(async (secret: string) => {
    const current = recordRef.current;
    if (!current) return false;
    const candidate =
      current.type === 'pattern' ? patternToSecret(secret.split('-').map(Number)) : secret;
    const hash = await hashSecret(candidate, current.salt);
    const ok = secretsMatch(hash, current.hash);
    if (ok) setLocked(false);
    return ok;
  }, []);

  const disable = useCallback(async () => {
    await clearAppLockRecord();
    recordRef.current = null;
    setRecord(null);
    setLocked(false);
  }, []);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    const current = recordRef.current;
    if (!current) return;
    const next: AppLockRecord = { ...current, biometricEnabled: enabled };
    await writeAppLockRecord(next);
    recordRef.current = next;
    setRecord(next);
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const current = recordRef.current;
    if (!current || !current.biometricEnabled) {
      return { success: false, cancelled: false };
    }
    const res = await authenticateBiometric('بازکردنِ نودوست');
    if (res.success) setLocked(false);
    return res;
  }, []);

  return (
    <AppLockContext.Provider
      value={{
        ready,
        configured: record !== null,
        type: record?.type ?? null,
        locked,
        configure,
        verify,
        disable,
        biometricEnabled: record?.biometricEnabled ?? false,
        setBiometricEnabled,
        unlockWithBiometrics,
      }}
    >
      {ready ? children : <Loading />}
      {locked && record ? <LockScreen record={record} /> : null}
    </AppLockContext.Provider>
  );
}

export function useAppLock(): AppLockValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within <AppLockProvider>');
  return ctx;
}
