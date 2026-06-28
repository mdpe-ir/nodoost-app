import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useCases } from '@/core/di/DIProvider';
import type { RandomMatch } from '@/domain/entities';

/** ویومدلِ چتِ تصادفی: پیوستن/خروج با فیلترِ جنسیت. */
export function useRandomViewModel() {
  const uc = useCases();
  const [gender, setGender] = useState<'' | 'f' | 'm'>('');
  const [state, setState] = useState<'idle' | 'waiting'>('idle');
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async () => {
    setError(null);
    setState('waiting');
    try {
      const r: RandomMatch = await uc.random.join({ gender: gender || undefined });
      if (r.status === 'matched' && r.matchId) {
        setState('idle');
        router.push({
          pathname: '/thread/[id]',
          params: { id: String(r.matchId), name: r.peer?.name ?? 'ناشناس' },
        });
      }
    } catch {
      setState('idle');
      setError('پیوستن ناموفق بود. دوباره تلاش کن.');
    }
  }, [gender, uc]);

  const leave = useCallback(async () => {
    try {
      await uc.random.leave();
    } catch {}
    setState('idle');
  }, [uc]);

  return { gender, setGender, state, error, join, leave };
}
