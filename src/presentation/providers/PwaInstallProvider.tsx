import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { InstallModal } from '@/presentation/components/InstallModal';

/**
 * مدیریتِ نصبِ PWA (فقط وب). یک منبعِ حقیقتِ واحد برای دکمه‌ی هدر و مودالِ پیشنهادِ نصب.
 * روی نیتیو کاملاً بی‌اثر است (فقط children را رندر می‌کند).
 *
 * اندروید استثناست: چون نسخه‌ی نیتیوِ اندروید داریم، به‌جای پیشنهادِ نصبِ PWA کاربر را به
 * صفحه‌ی نصبِ اپِ نیتیو (`/get-app`) می‌فرستیم — نه مودالِ PWA و نه promptِ مرورگر.
 * PWA فقط برای iOS/دسکتاپ (که اپِ نیتیو ندارند) پیشنهاد می‌شود.
 *
 * منطقِ نمایشِ خودکارِ مودال (فقط iOS/دسکتاپ):
 *  - اولین پیشنهاد در «دومین» بازدید (نه بارِ اول — تازه‌واردها را نمی‌رنجانیم).
 *  - سپس هر ۳ بازدیدِ یک‌بار دوباره پیشنهاد می‌دهیم.
 *  - «بعداً» ⇒ ۳ روز خاموش · «دیگر نشان نده» ⇒ برای همیشه خاموش.
 *  - اگر قبلاً نصب شده یا در حالتِ standalone باز شده، هرگز نشان داده نمی‌شود.
 */

const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // ۳ روز
const KEY_SESSIONS = 'pwa:sessions';
const KEY_SNOOZE = 'pwa:snoozeUntil';
const KEY_NEVER = 'pwa:never';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface PwaInstallContextValue {
  /** آیا اصلاً می‌توان دکمه‌ی نصب را نشان داد (وب، نصب‌نشده، غیرِ standalone، قابلِ نصب). */
  canInstall: boolean;
  /** iOS/سافاری است ⇒ نصب دستی از منوی اشتراک‌گذاری. */
  isIOS: boolean;
  isStandalone: boolean;
  /** درخواستِ نصبِ بومی (اندروید/دسکتاپ) یا بازکردنِ راهنما در iOS. */
  requestInstall: () => void;
  openModal: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  isIOS: false,
  isStandalone: false,
  requestInstall: () => {},
  openModal: () => {},
});

export const usePwaInstall = () => useContext(PwaInstallContext);

const isWeb = Platform.OS === 'web';

function detectStandalone(): boolean {
  if (!isWeb || typeof window === 'undefined') return false;
  const mm = window.matchMedia?.('(display-mode: standalone)')?.matches;
  // iOS سافاری از navigator.standalone استفاده می‌کند
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(mm || iosStandalone);
}

function detectIOSSafari(): boolean {
  if (!isWeb || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iphone|ipod|ipad/i.test(ua);
  // فقط سافاری «افزودن به صفحه‌ی اصلی» دارد؛ کروم/فایرفاکسِ iOS را کنار می‌گذاریم
  const otherBrowser = /crios|fxios|edgios/i.test(ua);
  return iOS && !otherBrowser;
}

function detectAndroid(): boolean {
  if (!isWeb || typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

function readLS(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage?.setItem(key, value);
  } catch {
    /* حالتِ خصوصی/بدونِ اجازه — بی‌خیال */
  }
}

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const autoShownRef = useRef(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  // خواندنِ محیط یک‌بار در نخستین رندر (روی نیتیو false برمی‌گردد).
  const [isStandalone] = useState(detectStandalone);
  const [isIOS] = useState(detectIOSSafari);
  const [isAndroid] = useState(detectAndroid);
  const [modalVisible, setModalVisible] = useState(false);

  // روی اندروید همیشه دکمه را نشان می‌دهیم (به نصبِ اپِ نیتیو می‌رود)؛ روی iOS/دسکتاپ فقط
  // وقتی PWA واقعاً قابلِ نصب است.
  const canInstall = isWeb && !isStandalone && (isAndroid || (!installed && (canPrompt || isIOS)));

  const maybeAutoShow = useCallback(() => {
    if (autoShownRef.current) return;
    if (typeof window === 'undefined') return;
    // اندروید پیشنهادِ نصبِ PWA نمی‌گیرد؛ به اپِ نیتیو هدایت می‌شود (AndroidAppGate / دکمه‌ی هدر).
    if (isAndroid) return;
    if (installed || detectStandalone()) return;
    if (readLS(KEY_NEVER) === '1') return;

    const installable = deferredRef.current != null || detectIOSSafari();
    if (!installable) return;

    const snoozeUntil = Number(readLS(KEY_SNOOZE) || 0);
    if (Date.now() < snoozeUntil) return;

    const sessions = Number(readLS(KEY_SESSIONS) || 0);
    const gate = sessions === 2 || (sessions > 2 && (sessions - 2) % 3 === 0);
    if (!gate) return;

    autoShownRef.current = true;
    setModalVisible(true);
  }, [installed, isAndroid]);

  // راه‌اندازیِ اولیه (یک‌بار در هر بارگذاری)
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    // شمارشِ بازدید — یک‌بار در هر بارگذاریِ صفحه
    const sessions = Number(readLS(KEY_SESSIONS) || 0) + 1;
    writeLS(KEY_SESSIONS, String(sessions));

    const onBIP = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
      maybeAutoShow();
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanPrompt(false);
      deferredRef.current = null;
      setModalVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);

    // iOS رویدادِ beforeinstallprompt ندارد ⇒ با کمی تأخیر (بعد از اسپلش) بررسی کن
    const t = setTimeout(maybeAutoShow, 1600);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestInstall = useCallback(async () => {
    // اندروید: نسخه‌ی نیتیو داریم ⇒ به‌جای نصبِ PWA کاربر را به صفحه‌ی نصبِ اپ می‌بریم.
    if (isAndroid) {
      router.push('/get-app');
      return;
    }
    const deferred = deferredRef.current;
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* کاربر لغو کرد یا مرورگر اجازه نداد */
      } finally {
        deferredRef.current = null;
        setCanPrompt(false);
        setModalVisible(false);
      }
      return;
    }
    // iOS یا وقتی prompt در دسترس نیست ⇒ راهنمای دستی را باز کن
    setModalVisible(true);
  }, [isAndroid]);

  const openModal = useCallback(() => setModalVisible(true), []);

  const snooze = useCallback(() => {
    writeLS(KEY_SNOOZE, String(Date.now() + SNOOZE_MS));
    setModalVisible(false);
  }, []);
  const dismissForever = useCallback(() => {
    writeLS(KEY_NEVER, '1');
    setModalVisible(false);
  }, []);

  return (
    <PwaInstallContext.Provider
      value={{ canInstall, isIOS, isStandalone, requestInstall, openModal }}
    >
      {children}
      {isWeb ? (
        <InstallModal
          visible={modalVisible}
          isIOS={isIOS}
          canPrompt={canPrompt}
          onInstall={requestInstall}
          onSnooze={snooze}
          onNever={dismissForever}
          onClose={() => setModalVisible(false)}
        />
      ) : null}
    </PwaInstallContext.Provider>
  );
}
