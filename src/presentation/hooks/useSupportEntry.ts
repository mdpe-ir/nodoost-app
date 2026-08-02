import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import type { SupportOverview } from '@/domain/entities';

/**
 * نسخه‌ی سبکِ وضعیتِ پشتیبانی — فقط برای نمایشِ ردیفِ سنجاق‌شده در فهرستِ گفتگوها.
 *
 * برخلافِ useSupportViewModel نه پیامی می‌گیرد و نه نظرسنجی می‌کند؛ یک درخواست
 * هنگامِ مونت و یکی هنگامِ برگشتِ فوکوس. اگر درخواست شکست بخورد بی‌صدا پنهان
 * می‌ماند: نبودِ ردیفِ پشتیبانی بهتر از خطا در فهرستِ گفتگوهاست.
 */
export function useSupportEntry() {
  const uc = useCases();
  const [overview, setOverview] = useState<SupportOverview | undefined>();

  const load = useCallback(async () => {
    try {
      setOverview(await uc.support.getOverview());
    } catch {
      setOverview(undefined);
    }
  }, [uc]);

  useEffect(() => {
    void load();
  }, [load]);
  useRefetchOnFocus(load);

  return {
    enabled: overview?.enabled ?? false,
    account: overview?.account,
    unread: overview?.unread ?? 0,
    hasThread: !!overview?.matchId,
  };
}
