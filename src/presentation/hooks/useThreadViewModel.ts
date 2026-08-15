import { useCallback, useEffect, useRef, useState } from 'react';
import { haptics } from '@/core/haptics';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { ApiError } from '@/core/http/ApiError';
import { recordInstallNagAction } from '@/core/installNag';
import { recordReviewMoment } from '@/core/reviewMoments';
import { quotaKeyForError } from '@/presentation/tiers/quotaCopy';
import type { Message } from '@/domain/entities';
import type { DeleteScope } from '@/domain/repositories/ChatRepository';

/** اندازه‌ی صفحه‌ی تاریخچه‌ی پیام. */
const PAGE = 30;

/**
 * پنجره‌ی ویرایش — هم‌ارزِ پیش‌فرضِ `chat_edit_window_minutes` در سرور. اینجا
 * فقط برای پنهان‌کردنِ گزینه‌ای است که شکست می‌خورد؛ قاعده‌ی واقعی سمتِ سرور
 * اعمال می‌شود و از پنلِ ادمین قابلِ تغییر است.
 */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function editErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'edit_window_passed') return 'مهلتِ ویرایشِ این پیام گذشته است.';
    if (e.code === 'edit_limit_reached') return 'به سقفِ دفعاتِ ویرایش رسیده‌ای.';
    if (e.code === 'support thread is immutable') return 'پیامِ پشتیبانی ویرایش نمی‌شود.';
  }
  return 'ویرایش انجام نشد. دوباره تلاش کن.';
}

/**
 * علتِ ردشدنِ ارسال، به‌شکلِ ساختاریافته.
 *
 * تا پیش از این فقط یک رشته‌ی فارسی برمی‌گشت که زیرِ ورودی به‌شکلِ متنِ ریزِ
 * قرمز چاپ می‌شد — همان جایی که کاربر نمی‌دیدش. حالا صفحه با همین شیء
 * برگه‌ی ارتقا را باز می‌کند و کاربر دقیقاً می‌بیند چه چیزی تمام شده و چه
 * چیزی بازش می‌کند.
 */
export type SendBlock =
  | { kind: 'quota'; quotaKey: 'conversation' }
  | { kind: 'tier'; requiredTier?: number };

function sendBlockOf(e: unknown): SendBlock | undefined {
  if (!(e instanceof ApiError)) return undefined;
  if (e.code === 'tier_locked') return { kind: 'tier', requiredTier: e.num('required_tier') };
  return quotaKeyForError(e.code) === 'conversation'
    ? { kind: 'quota', quotaKey: 'conversation' }
    : undefined;
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
  const [block, setBlock] = useState<SendBlock | undefined>();
  // پیامی که در حالِ پاسخ به آنیم، و پیامی که در حالِ ویرایشش هستیم. هرگز
  // هم‌زمان نیستند — نوارِ بالای ورودی یکی از این دو را نشان می‌دهد.
  const [replyTo, setReplyTo] = useState<Message | undefined>();
  const [editing, setEditing] = useState<Message | undefined>();
  const [editError, setEditError] = useState<string | undefined>();
  const olderInFlight = useRef(false);
  const { consume: consumeQuota, refresh: refreshQuota } = useQuota();

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
    // «شروعِ گفتگو» فقط اولین پیامِ یک رشته است؛ پاسخ‌دادن سهمیه نمی‌سوزاند.
    const isStarting = messages.length === 0;
    const replyId = replyTo?.id;
    setDraft('');
    setReplyTo(undefined);
    setSending(true);
    setBlock(undefined);
    try {
      const msg = await uc.chat.sendMessage(matchId, body, replyId);
      setMessages((prev) => [...prev, msg]);
      // بازخوردِ لمسی وقتی می‌زند که پیام واقعاً روی سرور نشسته، نه وقتی دکمه
      // فشرده شد. تفاوتش را کاربر روی اینترنتِ ضعیف حس می‌کند: لرزش یعنی «رفت».
      haptics.success();
      recordInstallNagAction();
      recordReviewMoment('action');
      if (isStarting) consumeQuota('conversation');
    } catch (e) {
      setDraft(body);
      if (replyTo) setReplyTo(replyTo);
      const b = sendBlockOf(e);
      setBlock(b);
      haptics.warn();
      // سرور می‌گوید سهمیه تمام شده ولی شمارنده‌ی اپ هنوز عدد داشت — یعنی
      // عددِ ما کهنه است. تازه‌اش کن تا برگه‌ی ارتقا حقیقت را نشان دهد.
      if (b?.kind === 'quota') refreshQuota();
    } finally {
      setSending(false);
    }
  }, [draft, matchId, uc, messages.length, consumeQuota, refreshQuota, replyTo]);

  /** ویرایش را ذخیره می‌کند. متنِ قبلی سمتِ سرور در تاریخچه می‌ماند. */
  const submitEdit = useCallback(async () => {
    const target = editing;
    const body = draft.trim();
    if (!target?.id || !body) return;
    if (body === target.body) {
      setEditing(undefined);
      setDraft('');
      return;
    }
    setSending(true);
    try {
      const res = await uc.chat.editMessage(target.id, body);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === target.id ? { ...m, body: res.body, editedAt: res.editedAt ?? m.editedAt } : m
        )
      );
      setEditing(undefined);
      setDraft('');
    } catch (e) {
      setEditError(editErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [draft, editing, uc]);

  /**
   * حذف. «برای همه» پیام را به سنگِ قبر تبدیل می‌کند (ردیف می‌ماند)، «برای من»
   * از فهرست بیرونش می‌برد — دقیقاً همان کاری که سرور در پاسخِ بعدی می‌کند.
   */
  const remove = useCallback(
    async (message: Message, scope: DeleteScope) => {
      if (!message.id) return;
      const id = message.id;
      const before = messages;
      setMessages((prev) =>
        scope === 'all'
          ? prev.map((m) => (m.id === id ? { ...m, body: '', deleted: true, replyTo: undefined } : m))
          : prev.filter((m) => m.id !== id)
      );
      try {
        await uc.chat.deleteMessage(id, scope);
      } catch {
        setMessages(before); // برگرداندنِ حالتِ خوش‌بینانه
      }
    },
    [messages, uc]
  );

  const startReply = useCallback((m: Message) => {
    setEditing(undefined);
    setReplyTo(m);
  }, []);

  const startEdit = useCallback((m: Message) => {
    setReplyTo(undefined);
    setEditing(m);
    setDraft(m.body);
    setEditError(undefined);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(undefined);
    setDraft('');
    setEditError(undefined);
  }, []);

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
    /** علتِ ردشدنِ ارسال — صفحه با آن برگه‌ی ارتقا را باز می‌کند. */
    block,
    clearBlock: useCallback(() => setBlock(undefined), []),
    /** آیا پیامِ بعدی «شروعِ گفتگو» است (و سهمیه می‌سوزاند). */
    isStarting: !loading && messages.length === 0,
    myId: user?.id,
    myTier: user?.tier ?? 1,
    // — کنترلِ پیام —
    replyTo,
    startReply,
    cancelReply: useCallback(() => setReplyTo(undefined), []),
    editing,
    startEdit,
    cancelEdit,
    submitEdit,
    editError,
    clearEditError: useCallback(() => setEditError(undefined), []),
    remove,
    /**
     * آیا این پیام هنوز قابلِ ویرایش است. پنجره سمتِ سرور هم اعمال می‌شود؛ این
     * فقط برای پنهان‌کردنِ گزینه‌ای است که شکست می‌خورد.
     */
    canEdit: useCallback(
      (m: Message) =>
        m.senderId === user?.id &&
        !m.deleted &&
        !!m.createdAt &&
        Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS,
      [user?.id]
    ),
  };
}
