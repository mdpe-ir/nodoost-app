import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Message } from '@/domain/entities';

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
    try {
      const msg = await uc.chat.sendMessage(matchId, body);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  }, [draft, matchId, uc]);

  return { messages, loading, draft, setDraft, send, sending, myId: user?.id };
}
