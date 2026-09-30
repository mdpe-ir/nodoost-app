import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from './useRefetchOnFocus';
import type { SharedMediaCounts, SharedMediaItem } from '@/domain/entities';

export type SharedMediaKind = 'photo' | 'voice';

/**
 * ویومدلِ «مدیای اشتراکی» — کلِ تاریخچه‌ی عکس/صدای یک گفتگو، صفحه‌به‌صفحه.
 *
 * چرا جدا از حافظه‌ی تِرِد: تاریخچه‌ی پیام ۳۰تایی صفحه‌بندی می‌شود و مدیای
 * قدیمیِ یک گفتگوی طولانی هرگز به اپ نمی‌رسد؛ این‌جا سرور مستقیم فهرستِ
 * چندرسانه‌ای را می‌دهد و با `before` (شناسه‌ی پیام) عقب می‌رویم.
 *
 * تبِ عکس/صدا مستقل بارگذاری می‌شود: سوییچِ تب، فهرستِ خودش را دارد و
 * شمارنده‌های کل از همان پاسخِ اول می‌آیند تا «اطلاعاتِ مخاطب» و این صفحه
 * بدونِ درخواستِ دوم، شمارنده‌ی مشترک داشته باشند.
 */
export function useSharedMediaViewModel(matchId: number) {
  const uc = useCases();
  const [kind, setKind] = useState<SharedMediaKind>('photo');
  const [items, setItems] = useState<SharedMediaItem[]>([]);
  const [counts, setCounts] = useState<SharedMediaCounts>({ photo: 0, voice: 0 });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  /**
   * شناسه‌ی درخواستِ جاری — سوییچِ سریعِ تب نباید پاسخِ دیرِ تبِ قبلی را روی
   * صفحه بگذارد. `hasMore` هم در رِف می‌ماند تا `loadMore` همیشه تازه باشد.
   */
  const reqId = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const loadKind = useCallback(
    async (k: SharedMediaKind) => {
      const id = ++reqId.current;
      setLoading(true);
      setError(false);
      setItems([]);
      hasMoreRef.current = false;
      setHasMore(false);
      try {
        const page = await uc.chat.getSharedMedia(matchId, k);
        if (id !== reqId.current) return;
        setItems(page.items);
        setCounts(page.counts);
        hasMoreRef.current = page.hasMore;
        setHasMore(page.hasMore);
      } catch {
        if (id === reqId.current) setError(true);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [uc, matchId]
  );

  useEffect(() => {
    // بارگذاریِ داده در افکت دقیقاً کارِ افکت است؛ همین الگو در
    // `useChatInfoViewModel` هم با توضیحِ کامل هست.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKind('photo');
  }, [loadKind]);

  /** سوییچِ تب — کنشِ صریحِ کاربر، نه افکت؛ لودرِ تمام‌صفحه می‌گیرد. */
  const switchKind = useCallback(
    (k: SharedMediaKind) => {
      if (k === kind) return;
      setKind(k);
      void loadKind(k);
    },
    [kind, loadKind]
  );

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    const last = items[items.length - 1];
    if (!last) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await uc.chat.getSharedMedia(matchId, kind, { before: last.id });
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
      setItems((prev) => {
        // خودِ این قلم در فاصله‌ی دو درخواست تازه شده؟ دوباره اضافه نکن.
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
    } catch {
      // صفحه‌بندی شکست می‌خورد؟ فهرست همان می‌ماند؛ کاربر دوباره اسکرول می‌کند.
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [uc, matchId, kind, items]);

  const reload = useCallback(async () => {
    await loadKind(kind);
  }, [loadKind, kind]);

  useRefetchOnFocus(reload);

  return {
    kind,
    switchKind,
    items,
    counts,
    hasMore,
    loading,
    loadingMore,
    error,
    reload,
    loadMore,
  };
}
