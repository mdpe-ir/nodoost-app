import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Message, SupportOverview } from '@/domain/entities';

/** اندازه‌ی صفحه‌ی تاریخچه‌ی پیام — هم‌اندازه‌ی گفتگوی معمولی. */
const PAGE = 30;

/** فاصله‌ی تازه‌سازیِ بی‌صدا وقتی گفتگو باز است. */
const POLL_MS = 5000;

/** دو فهرستِ پیام را با کلیدِ id یکی و صعودی می‌کند (تکراری‌ها حذف). */
function mergeAsc(a: Message[], b: Message[]): Message[] {
  const map = new Map<number, Message>();
  for (const m of a) if (m.id != null) map.set(m.id, m);
  for (const m of b) if (m.id != null) map.set(m.id, m);
  return Array.from(map.values()).sort((x, y) => (x.id ?? 0) - (y.id ?? 0));
}

/**
 * ویومدلِ پشتیبانی — دو حالت در یک صفحه:
 *
 *  ۱. هنوز گفتگویی نیست ⇒ انتخابِ موضوع (`topics`).
 *  ۲. گفتگو باز است ⇒ همان تجربه‌ی چت (`messages`، `send`).
 *
 * عمداً به صفحه‌ی گفتگوی معمولی (`/thread/[id]`) منتقل نمی‌شویم: آن مسیر پشتِ
 * دروازه‌ی «پروفایلِ کامل» است و کاربرِ مسدود یا نیمه‌ثبت‌نام — که بیشترین نیاز
 * را به پشتیبانی دارد — پشتِ آن گیر می‌کند.
 */
export function useSupportViewModel() {
  const uc = useCases();
  const { user } = useSession();

  const [overview, setOverview] = useState<SupportOverview | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();
  const olderInFlight = useRef(false);

  const hasThread = !!overview?.matchId;

  const loadMessages = useCallback(
    async (silent = false) => {
      try {
        const latest = await uc.support.getMessages({ limit: PAGE });
        if (silent) {
          setMessages((prev) => mergeAsc(prev, latest));
        } else {
          setMessages(latest);
          setHasMore(latest.length >= PAGE);
        }
      } catch {
        /* تازه‌سازیِ بی‌صدا نباید صفحه را بشکند */
      }
    },
    [uc]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const o = await uc.support.getOverview();
      setOverview(o);
      if (o.matchId) await loadMessages();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc, loadMessages]);

  useEffect(() => {
    void load();
  }, [load]);

  // فقط وقتی گفتگو باز است نظرسنجی می‌کنیم — صفحه‌ی انتخابِ موضوع چیزی برای
  // تازه‌کردن ندارد.
  useEffect(() => {
    if (!hasThread) return;
    const timer = setInterval(() => void loadMessages(true), POLL_MS);
    return () => clearInterval(timer);
  }, [hasThread, loadMessages]);

  /** صفحه‌ی قدیمی‌ترِ بعدی را می‌گیرد و بالای فهرست می‌افزاید. */
  const loadOlder = useCallback(async () => {
    if (olderInFlight.current || !hasMore) return;
    const oldestId = messages[0]?.id;
    if (oldestId == null) return;
    olderInFlight.current = true;
    setLoadingOlder(true);
    try {
      const older = await uc.support.getMessages({ before: oldestId, limit: PAGE });
      setHasMore(older.length >= PAGE);
      if (older.length > 0) setMessages((prev) => mergeAsc(older, prev));
    } catch {
      /* دوباره تلاش می‌شود */
    } finally {
      olderInFlight.current = false;
      setLoadingOlder(false);
    }
  }, [uc, hasMore, messages]);

  /** انتخابِ موضوع ⇒ بازکردنِ گفتگو و آوردنِ پیامِ خوش‌آمد. */
  const startThread = useCallback(
    async (topic: string) => {
      setStarting(true);
      setSendError(undefined);
      try {
        const matchId = await uc.support.startThread(topic);
        setOverview((prev) => (prev ? { ...prev, matchId, topic, status: 'open' } : prev));
        await loadMessages();
      } catch {
        setSendError('باز کردنِ گفتگو ناموفق بود. دوباره تلاش کن.');
      } finally {
        setStarting(false);
      }
    },
    [uc, loadMessages]
  );

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setSending(true);
    setSendError(undefined);
    try {
      const msg = await uc.support.sendMessage(body, overview?.topic);
      setMessages((prev) => mergeAsc(prev, [msg]));
      // اولین پیام ممکن است گفتگو را همین‌جا ساخته باشد.
      if (!overview?.matchId) {
        setOverview((prev) => (prev ? { ...prev, matchId: msg.matchId, status: 'open' } : prev));
      }
    } catch {
      setDraft(body);
      setSendError('ارسال ناموفق بود. اتصالت را بررسی کن.');
    } finally {
      setSending(false);
    }
  }, [draft, overview, uc]);

  return {
    overview,
    enabled: overview?.enabled ?? false,
    account: overview?.account,
    topics: overview?.topics ?? [],
    hasThread,
    messages,
    loading,
    error,
    reload: load,
    starting,
    startThread,
    loadingOlder,
    hasMore,
    loadOlder,
    draft,
    setDraft,
    send,
    sending,
    sendError,
    myId: user?.id,
  };
}
