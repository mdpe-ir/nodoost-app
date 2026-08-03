import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import {
  inAppStateStorage,
  type DeviceMessageState,
} from '@/core/storage/inAppMessages';
import type { InAppMessage } from '@/domain/entities';

interface InAppMessagesValue {
  /** بنرِ فعالِ صفحه‌ی خانه (بیشترین اولویت) یا null. */
  banner: InAppMessage | null;
  /** پاپ‌آپِ فعال یا null — هم‌زمان فقط یکی. */
  popup: InAppMessage | null;
  /** اعلان‌های درون‌اپ به ترتیبِ اولویت. */
  alarms: InAppMessage[];
  /** اعلان‌هایی که هنوز باز نشده‌اند — به نشانِ زنگوله اضافه می‌شود. */
  unreadAlarms: number;
  byId: (id: number) => InAppMessage | undefined;

  /** «نشان داده شد» — یک بار به‌ازای هر پیام در هر اجرای اپ. */
  markShown: (m: InAppMessage) => void;
  /** کاربر بست. */
  dismiss: (m: InAppMessage) => void;
  /** کاربر روی دکمه یا کارت زد. */
  click: (m: InAppMessage) => void;
  refresh: () => void;
}

const empty: InAppMessagesValue = {
  banner: null,
  popup: null,
  alarms: [],
  unreadAlarms: 0,
  byId: () => undefined,
  markShown: () => {},
  dismiss: () => {},
  click: () => {},
  refresh: () => {},
};

const InAppMessagesContext = createContext<InAppMessagesValue>(empty);

export const useInAppMessages = () => useContext(InAppMessagesContext);

const MINUTE = 60_000;

/** سیاست‌هایی که سقفِ شمارشی دارند؛ فقط برای اینها «بستن» یعنی «تمام». */
const CAPPED = new Set<InAppMessage['policy']>(['once', 'max_count']);

/**
 * پیام‌های درون‌برنامه‌ای را می‌گیرد، سیاستِ تکرارِ سمتِ کلاینت را اجرا می‌کند و
 * سه سطحِ نمایش را در اختیارِ درختِ اپ می‌گذارد.
 *
 * تقسیمِ کار با سرور:
 *   • سرور: زمان‌بندی، سگمنت، و سیاستِ تکرارِ پیام‌های `scope='server'`.
 *   • کلاینت: `once_per_session` (سرور «نشست» را نمی‌شناسد)، سیاستِ کاملِ
 *     پیام‌های `scope='client'`، و پنهان‌کردنِ بی‌درنگِ چیزی که کاربر بست.
 *
 * قاعده‌ی نمایش عمداً ساده است: پیامی که واجدِ شرایط است می‌ماند تا کاربر ببندد
 * یا رویش بزند. «چند بار دیده شده» فقط تعیین می‌کند دفعه‌ی بعد برمی‌گردد یا نه —
 * وگرنه بنر همان لحظه‌ی نمایش خودش را خاموش می‌کرد.
 *
 * خرابی fail-safe است: هر خطا یعنی «پیامی نیست».
 */
export function InAppMessagesProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const { status } = useSession();
  const [messages, setMessages] = useState<InAppMessage[]>([]);
  const [device, setDevice] = useState<Record<string, DeviceMessageState>>({});
  /** بسته‌شده‌های همین اجرای اپ — با هر بار باز شدنِ اپ خالی می‌شود. */
  const [closed, setClosed] = useState<ReadonlySet<number>>(() => new Set());
  /**
   * نمایش‌داده‌شده‌های همین اجرا. هم حالت است و هم ref: حالت را رندر می‌خواند
   * (تصمیمِ «هنوز واجد است؟») و ref را کنش‌گر، تا دو فراخوانیِ پشتِ هم پیش از
   * رسیدنِ رندرِ بعدی، دو بار نمایش نشمارند.
   */
  const [shown, setShown] = useState<ReadonlySet<number>>(() => new Set());
  const shownOnce = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (status !== 'authed') return;
    try {
      const [list, blob] = await Promise.all([
        uc.inAppMessages.list(),
        inAppStateStorage.load(),
      ]);
      setDevice(blob);
      setMessages(list);
    } catch {
      setMessages([]);
    }
  }, [uc, status]);

  // ورود ⇒ بگیر. خروج ⇒ هم فهرست را خالی کن و هم حافظه‌ی دستگاه را پاک کن،
  // چون معنیِ scope='client' دقیقاً همین است: با ورودِ دوباره از نو دیده شود.
  useEffect(() => {
    if (status !== 'authed') {
      // خروج از حساب فقط حافظه‌ی بیرونی را پاک می‌کند؛ حالتِ React با همان
      // گاردِ `status` در محاسبه‌ی مقدار خنثی می‌شود (نیازی به پاک‌کردنِ دستی نیست).
      if (status === 'guest') void inAppStateStorage.clear();
      return;
    }
    let alive = true;
    void (async () => {
      const [list, blob] = await Promise.all([
        uc.inAppMessages.list().catch(() => [] as InAppMessage[]),
        inAppStateStorage.load(),
      ]);
      if (!alive) return;
      // ورودِ تازه ⇒ حالتِ نشستِ قبلی نباید ارث برسد؛ همان پیامِ همگانی ممکن
      // است برای کاربرِ تازه هم بیاید و نباید «قبلاً بسته شده» به‌حساب بیاید.
      setClosed(new Set());
      setShown(new Set());
      shownOnce.current = new Set();
      setDevice(blob);
      setMessages(list);
    })();
    return () => {
      alive = false;
    };
  }, [status, uc]);

  // بازگشت از پس‌زمینه ⇒ تازه‌سازی. پیامی که ادمین همین حالا فعال کرده باید
  // بدونِ بستن و باز کردنِ اپ برسد.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load();
    });
    return () => sub.remove();
  }, [load]);

  const markShown = useCallback(
    (m: InAppMessage) => {
      if (shownOnce.current.has(m.id)) return;
      shownOnce.current.add(m.id);
      setShown((prev) => new Set(prev).add(m.id));
      void inAppStateStorage.bump(m.id).then(setDevice).catch(() => {});
      uc.inAppMessages.recordEvent(m.id, 'impression');
    },
    [uc]
  );

  const dismiss = useCallback(
    (m: InAppMessage) => {
      setClosed((prev) => new Set(prev).add(m.id));
      // «بستن» را فقط برای سیاست‌های سقف‌دار ماندگار می‌کنیم؛ بستنِ بنرِ روزانه
      // یعنی «امروز نه»، نه «هرگز». سمتِ سرور هم همین قاعده اجرا می‌شود.
      if (CAPPED.has(m.policy)) {
        void inAppStateStorage.patch(m.id, { d: true }).then(setDevice).catch(() => {});
      }
      uc.inAppMessages.recordEvent(m.id, 'dismiss');
    },
    [uc]
  );

  const click = useCallback(
    (m: InAppMessage) => {
      // زدنِ روی اعلان یعنی خوانده شد؛ همان‌جا از شمارِ خوانده‌نشده‌ها بیرون می‌رود.
      void inAppStateStorage.patch(m.id, { o: true }).then(setDevice).catch(() => {});
      uc.inAppMessages.recordEvent(m.id, 'click');
    },
    [uc]
  );

  /** آیا این پیام با قواعدِ سمتِ کلاینت هنوز قابلِ نمایش است؟ */
  const eligible = useCallback(
    (m: InAppMessage): boolean => {
      if (closed.has(m.id)) return false;
      // پیامی که همین حالا رویِ صفحه است باید بماند تا کاربر ببندد یا رویش بزند.
      // بدونِ این، شمارنده‌ای که خودِ نمایش بالا برده بلافاصله پنهانش می‌کرد.
      // (`once_per_session` هم همین‌جا درست می‌شود: تا بسته نشود می‌ماند، و چون
      //  `shown` فقط در حافظه است، اجرای بعدیِ اپ از نو شروع می‌کند.)
      if (shown.has(m.id)) return true;
      if (m.scope === 'server') return true;

      // از اینجا به بعد سرور فیلتری نگذاشته؛ همه‌چیز به عهده‌ی دستگاه است.
      const state = device[String(m.id)];
      const n = state?.n ?? 0;
      if (state?.d && CAPPED.has(m.policy)) return false;
      if (m.cooldownMinutes > 0 && state?.t && Date.now() - state.t < m.cooldownMinutes * MINUTE) {
        return false;
      }
      switch (m.policy) {
        case 'once':
          return n < 1;
        case 'max_count':
          return n < Math.max(1, m.maxImpressions);
        case 'once_per_day':
          return !state?.t || !isSameDay(state.t, Date.now());
        default:
          return true;
      }
    },
    [device, closed, shown]
  );

  const value = useMemo<InAppMessagesValue>(() => {
    // با خروج از حساب هیچ پیامی نباید بماند — حتی برای یک فریم.
    if (status !== 'authed') return empty;
    const live = messages.filter(eligible);
    const pick = (surface: InAppMessage['surface']) =>
      live.find((m) => m.surface === surface) ?? null;

    // اعلان‌ها بر خلافِ بنر و پاپ‌آپ فهرست‌اند نه تک‌آیتم — صفحه‌ی اعلان‌ها
    // همه‌شان را کنارِ هم نشان می‌دهد.
    const alarms = live.filter((m) => m.surface === 'alarm');
    const unreadAlarms = alarms.filter((m) => !device[String(m.id)]?.o).length;

    return {
      banner: pick('banner'),
      popup: pick('popup'),
      alarms,
      unreadAlarms,
      // با شناسه از کلِ فهرست پیدا می‌کند نه فقط واجدها: صفحه‌ی تمام‌صفحه‌ای که
      // تازه بازش کرده‌ای نباید وسطِ راه خالی شود چون پیام دیگر واجد نیست.
      byId: (id: number) => messages.find((m) => m.id === id),
      markShown,
      dismiss,
      click,
      refresh: () => void load(),
    };
  }, [status, messages, eligible, device, markShown, dismiss, click, load]);

  return (
    <InAppMessagesContext.Provider value={value}>{children}</InAppMessagesContext.Provider>
  );
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
