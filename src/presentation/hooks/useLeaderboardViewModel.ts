import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { Leaderboard, LeaderWindow } from '@/domain/entities';

/**
 * ویومدلِ جدولِ رتبه‌بندی.
 *
 * هر بازه پس از اولین بار در حافظه می‌ماند، پس جابه‌جایی بینِ «امروز» و
 * «این هفته» بی‌درنگ است و اسکلتون دوباره نمی‌پرد. تازه‌سازیِ دستی همیشه از
 * سرور می‌خواند — کشِ سرور خودش کوتاه‌عمر است.
 */
export function useLeaderboardViewModel(initial: LeaderWindow = 'weekly') {
  const uc = useCases();
  const [window, setWindow] = useState<LeaderWindow>(initial);
  const [boards, setBoards] = useState<Partial<Record<LeaderWindow, Leaderboard>>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // بازه‌هایی که درخواستشان در پرواز است — تا تعویضِ سریعِ تب چند درخواستِ
  // هم‌زمانِ تکراری نسازد.
  const inflight = useRef<Set<LeaderWindow>>(new Set());
  // بازه‌هایی که داده‌شان را داریم. ref است نه state، چون فقط تصمیمِ «دوباره
  // بگیرم یا نه» را می‌سازد و نباید رندر تحریک کند.
  const loaded = useRef<Set<LeaderWindow>>(new Set());

  const fetchWindow = useCallback(
    async (w: LeaderWindow, force: boolean) => {
      if (inflight.current.has(w)) return;
      inflight.current.add(w);
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const board = await uc.missions.getLeaderboard(w);
        loaded.current.add(w);
        setBoards((prev) => ({ ...prev, [w]: board }));
      } catch {
        // علامتِ «گرفته شد» برداشته می‌شود تا برگشت به همین تب دوباره تلاش کند.
        // خطا بی‌قید ثبت می‌شود و هنگامِ خروجی با «داده‌ای داریم یا نه» ترکیب
        // می‌شود، تا تازه‌سازیِ ناموفق جدولِ روی صفحه را پاک نکند.
        loaded.current.delete(w);
        setError(true);
      } finally {
        inflight.current.delete(w);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [uc]
  );

  // فقط به تعویضِ بازه واکنش نشان می‌دهد، نه به پر شدنِ boards: گذاشتنِ boards
  // در وابستگی‌ها یعنی هر واکشیِ موفق اثر را دوباره اجرا می‌کند.
  useEffect(() => {
    if (loaded.current.has(window) || inflight.current.has(window)) return;
    void fetchWindow(window, false);
  }, [window, fetchWindow]);

  const board = boards[window] ?? null;

  return {
    window,
    setWindow,
    board,
    loading: loading && !board,
    refreshing,
    error: error && !board,
    refresh: useCallback(() => fetchWindow(window, true), [fetchWindow, window]),
    reload: useCallback(() => fetchWindow(window, false), [fetchWindow, window]),
  };
}
