import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';

type FetchyTokenBridge = {
  getToken(): Promise<string | null>;
};

const fetchyToken = NativeModules.FetchyToken as FetchyTokenBridge | undefined;
const RETRY_DELAY_MS = 5_000;
const MAX_ATTEMPTS = 12;

/**
 * SDK توکن را ناهمگام پس از initialize می‌سازد. بعد از ورود تا یک دقیقه آن را
 * می‌خوانیم و به حساب جاری وصل می‌کنیم؛ نبودن پل در APK قدیمی بی‌خطر است.
 */
export function FetchyDeviceRegistration() {
  const { status } = useSession();
  const uc = useCases();

  useEffect(() => {
    if (Platform.OS !== 'android' || status !== 'authed' || !fetchyToken) return;

    let cancelled = false;

    const wait = () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS);
      });

    void (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !cancelled; attempt += 1) {
        try {
          const token = (await fetchyToken.getToken())?.trim();
          if (token) {
            await uc.profile.registerDevice(token, 'android');
            return;
          }
        } catch {
          // ثبت توکن نباید ورود کاربر را مختل کند؛ تا پایان بازه دوباره تلاش می‌شود.
        }
        await wait();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, uc]);

  return null;
}
