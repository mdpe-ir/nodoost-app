import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { ApiError } from '@/core/http/ApiError';
import type { Message } from '@/domain/entities';

/** اندازه‌ی صفحه‌ی تاریخچه‌ی پیام. */
const PAGE = 30;

/** پیامِ فارسیِ خطاهای سطح/سقفِ گفتگو؛ برای بقیه‌ی خطاها undefined. */
function limitErrorMessage(e: unknown): string | undefined {
  if (!(e instanceof ApiError)) return undefined;
  switch (e.code) {
    case 'tier_locked':
      return 'سطحِ این کاربر بالاتر از توست؛ برای شروعِ گفتگو باید سطحت را ارتقا بدهی.';
    case 'free_limit_reached':
      return 'سهمِ گفتگوی رایگانت استفاده شده — برای شروعِ گفتگوی تازه سطحت را ارتقا بده.';
    case 'daily_limit_reached':
      return 'سقفِ شروعِ گفتگوی امروزت پر شده. فردا دوباره می‌توانی، یا سطحت را ارتقا بده.';
    default:
      return undefined;
  }
}

/** دو فهرستِ پیام را با کلیدِ id یکی می‌کند و صعودی مرتب می‌کند (تکراری‌ها حذف). */
function mergeAsc(a: Message[], b: Message[]): Message[] {
  const map = new Map<number, Message>();
  for (const m of a) if (m.id != null) map.set(m.id, m);
  for (const m of b) if (m.id != null) map.set(m.id, m);
  return Array.from(map.values()).sort((x, y) => (x.id ?? 0) - (y.id ?? 0));
}

/**
 * ویومدلِ یک گفتگو: بارگذاریِ پیام‌ها + ارسال + بارگذاریِ گذشته (صفحه‌بندی).
 * هر چند ثانیه بی‌صدا آخرین صفحه را می‌گیرد و با پیام‌های موجود ادغام می‌کند تا
 * هم پیام‌های تازه‌ی طرفِ مقابل بیایند و هم پیام‌های قدیمیِ بارگذاری‌شده حفظ شوند.
 */
export function useThreadViewModel(matchId: number) {
  const uc = useCases();
  const { user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();
  const olderInFlight = useRef(false);

  // بارگذاری/تازه‌سازیِ آخرین صفحه. در حالتِ silent با فهرستِ فعلی ادغام می‌کند
  // تا پیام‌های قدیمیِ بارگذاری‌شده و موقعیتِ اسکرول از بین نرود.
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const latest = await uc.chat.getMessages(matchId, { limit: PAGE });
        if (silent) {
          setMessages((prev) => mergeAsc(prev, latest));
        } else {
          setMessages(latest);
          setHasMore(latest.length >= PAGE);
        }
      } catch {
        /* خطا را در نمایش نادیده می‌گیریم تا تجربه قطع نشود */
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [uc, matchId]
  );

  useEffect(() => {
    if (!matchId) return;
    load();
    const timer = setInterval(() => load(true), 4000);
    return () => clearInterval(timer);
  }, [load, matchId]);

  /** صفحه‌ی قدیمی‌ترِ بعدی را می‌گیرد و بالای فهرست می‌افزاید. */
  const loadOlder = useCallback(async () => {
    if (olderInFlight.current || !hasMore) return;
    const oldestId = messages[0]?.id;
    if (oldestId == null) return;
    olderInFlight.current = true;
    setLoadingOlder(true);
    try {
      const older = await uc.chat.getMessages(matchId, { before: oldestId, limit: PAGE });
      setHasMore(older.length >= PAGE);
      if (older.length > 0) setMessages((prev) => mergeAsc(older, prev));
    } catch {
      /* دوباره تلاش می‌شود */
    } finally {
      olderInFlight.current = false;
      setLoadingOlder(false);
    }
  }, [uc, matchId, hasMore, messages]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setSending(true);
    setSendError(undefined);
    try {
      const msg = await uc.chat.sendMessage(matchId, body);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setDraft(body);
      setSendError(limitErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [draft, matchId, uc]);

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    loadOlder,
    draft,
    setDraft,
    send,
    sending,
    sendError,
    myId: user?.id,
    myTier: user?.tier ?? 1,
  };
}
