import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { ApiError } from '@/core/http/ApiError';
import type { Message } from '@/domain/entities';

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

/**
 * ویومدلِ یک گفتگو: بارگذاریِ پیام‌ها + ارسال. هر چند ثانیه بی‌صدا تازه‌سازی
 * می‌کند تا پیام‌های طرفِ مقابل هم دیده شوند (جایگزینِ ساده‌ی WebSocket).
 */
export function useThreadViewModel(matchId: number) {
  const uc = useCases();
  const { user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setMessages(await uc.chat.getMessages(matchId));
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
    draft,
    setDraft,
    send,
    sending,
    sendError,
    myId: user?.id,
    myTier: user?.tier ?? 1,
  };
}
