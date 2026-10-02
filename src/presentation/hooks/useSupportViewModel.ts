import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Message, SupportOverview } from '@/domain/entities';

/** اندازه‌ی صفحه‌ی تاریخچه‌ی پیام — هم‌اندازه‌ی گفتگوی معمولی. */
const PAGE = 30;

/** فاصله‌ی تازه‌سازیِ بی‌صدا وقتی گفتگو باز است. */
const POLL_MS = 5000;

/** دو فهرستِ پیام را با کلیدِ id یکی و صعودی می‌کند (تکراری‌ها حذف).
 * پیام‌های خوش‌بینانه‌ی بدون id حفظ می‌شوند. */
function mergeAsc(a: Message[], b: Message[]): Message[] {
  const pending = a.filter((m) => m.id == null && m.clientId);
  const map = new Map<number, Message>();
  for (const m of a) if (m.id != null) map.set(m.id, m);
  for (const m of b) {
    if (m.id == null) continue;
    const prev = map.get(m.id);
    map.set(
      m.id,
      prev?.localUri && !m.localUri ? { ...m, localUri: prev.localUri, clientId: prev.clientId } : m
    );
  }
  const merged = Array.from(map.values()).sort((x, y) => (x.id ?? 0) - (y.id ?? 0));
  return pending.length ? [...merged, ...pending] : merged;
}

function newClientId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  const fetchOverview = useCallback(async () => uc.support.getOverview(), [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const o = await fetchOverview();
      setOverview(o);
      if (o.matchId) await loadMessages();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, loadMessages]);

  // بارِ اول: loading از قبل true است؛ setState فقط بعد از await تا lintِ
  // «setState هم‌زمان در effect» برنخورد.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const o = await fetchOverview();
        if (cancelled) return;
        setOverview(o);
        if (o.matchId) {
          const latest = await uc.support.getMessages({ limit: PAGE });
          if (cancelled) return;
          setMessages(latest);
          setHasMore(latest.length >= PAGE);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOverview, uc]);

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

  const patchByClientId = useCallback((clientId: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, ...patch } : m)));
  }, []);

  const sendText = useCallback(
    async (body: string, opts?: { clientId?: string }) => {
      const clientId = opts?.clientId ?? newClientId();
      setSendError(undefined);

      if (!opts?.clientId) {
        setMessages((prev) => [
          ...prev,
          {
            clientId,
            matchId: overview?.matchId ?? 0,
            senderId: user?.id ?? 0,
            kind: 'text' as const,
            body,
            pending: true,
            failed: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        patchByClientId(clientId, { pending: true, failed: false });
      }

      try {
        setSending(true);
        const msg = await uc.support.sendMessage(body, overview?.topic);
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? { ...msg, clientId, pending: false, failed: false }
              : m
          )
        );
        if (!overview?.matchId) {
          setOverview((prev) => (prev ? { ...prev, matchId: msg.matchId, status: 'open' } : prev));
        }
      } catch {
        patchByClientId(clientId, { pending: false, failed: true });
        setSendError('ارسال ناموفق بود. اتصالت را بررسی کن.');
      } finally {
        setSending(false);
      }
    },
    [overview, uc, user?.id, patchByClientId]
  );

  const send = useCallback(() => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    void sendText(body);
  }, [draft, sendText]);

  const sendPhoto = useCallback(
    async (uri: string, retry?: { clientId: string; uploadUri?: string }) => {
      let mid = overview?.matchId;
      if (!mid && overview?.topic) {
        try {
          mid = await uc.support.startThread(overview.topic);
          setOverview((prev) => (prev ? { ...prev, matchId: mid, status: 'open' } : prev));
        } catch {
          setSendError('باز کردنِ گفتگو ناموفق بود.');
          return;
        }
      }
      if (!mid) return;

      const clientId = retry?.clientId ?? newClientId();
      setSendError(undefined);

      if (!retry) {
        setMessages((prev) => [
          ...prev,
          {
            clientId,
            matchId: mid!,
            senderId: user?.id ?? 0,
            kind: 'photo',
            body: '',
            localUri: uri,
            pending: true,
            failed: false,
            transferPhase: 'preparing',
            mediaMeta: { mime: 'image/jpeg' },
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        patchByClientId(clientId, {
          pending: true,
          failed: false,
          transferPhase: retry.uploadUri ? 'uploading' : 'preparing',
          transferProgress: 0,
        });
      }

      try {
        setSending(true);
        let uploadUri = retry?.uploadUri ?? uri;
        if (!retry?.uploadUri) {
          const { toJpeg } = await import('@/core/media/normalizeImage');
          const prepared = await toJpeg(uri, { maxSize: 1280, compress: 0.85 });
          uploadUri = prepared.uri;
          patchByClientId(clientId, {
            localUri: uploadUri,
            transferPhase: 'uploading',
            transferProgress: 0,
            mediaMeta: {
              width: prepared.width,
              height: prepared.height,
              mime: 'image/jpeg',
            },
          });
        }

        const msg = await uc.support.sendPhoto(uploadUri, overview?.topic, (ratio) => {
          patchByClientId(clientId, { transferPhase: 'uploading', transferProgress: ratio });
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? {
                  ...msg,
                  clientId,
                  localUri: uploadUri,
                  pending: false,
                  failed: false,
                  transferPhase: undefined,
                  transferProgress: undefined,
                }
              : m
          )
        );
      } catch {
        patchByClientId(clientId, {
          pending: false,
          failed: true,
          transferPhase: undefined,
          transferProgress: undefined,
        });
        setSendError('ارسال ناموفق بود. اتصالت را بررسی کن.');
      } finally {
        setSending(false);
      }
    },
    [overview, uc, user?.id, patchByClientId]
  );

  const retryMessage = useCallback(
    (clientId: string) => {
      const target = messages.find((m) => m.clientId === clientId && m.failed);
      if (!target) return;
      if (target.kind === 'photo') {
        if (!target.localUri) return;
        void sendPhoto(target.localUri, {
          clientId,
          uploadUri: target.mediaMeta?.width ? target.localUri : undefined,
        });
        return;
      }
      if (target.body) void sendText(target.body, { clientId });
    },
    [messages, sendPhoto, sendText]
  );

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
    sendPhoto,
    retryMessage,
    sending,
    sendError,
    myId: user?.id,
    myTier: user?.tier ?? 1,
  };
}
