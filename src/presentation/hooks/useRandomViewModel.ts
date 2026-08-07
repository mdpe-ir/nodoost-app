import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useCases } from '@/core/di/DIProvider';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { quotaKeyForError } from '@/presentation/tiers/quotaCopy';
import { ApiError } from '@/core/http/ApiError';
import type { RandomMatch } from '@/domain/entities';

/** ویومدلِ چتِ تصادفی: پیوستن/خروج با فیلترِ جنسیت. */
export function useRandomViewModel() {
  const uc = useCases();
  const [gender, setGender] = useState<'' | 'f' | 'm'>('');
  const [state, setState] = useState<'idle' | 'waiting'>('idle');
  const [error, setError] = useState<string | null>(null);
  /** سقفِ روزانه‌ی شانسی خورد — صفحه با آن برگه‌ی ارتقا را باز می‌کند. */
  const [limitHit, setLimitHit] = useState(false);
  const { consume: consumeQuota, refresh: refreshQuota } = useQuota();

  const join = useCallback(async () => {
    setError(null);
    setState('waiting');
    try {
      const r: RandomMatch = await uc.random.join({ gender: gender || undefined });
      if (r.status === 'matched' && r.matchId) {
        setState('idle');
        consumeQuota('random');
        router.push({
          pathname: '/thread/[id]',
          params: {
            id: String(r.matchId),
            name: r.peer?.name ?? 'ناشناس',
            peerId: r.peer?.id ? String(r.peer.id) : '',
            photoUrl: r.peer?.photoUrl ?? '',
            peerTier: r.peer?.tier ? String(r.peer.tier) : '',
          },
        });
      }
    } catch (e) {
      setState('idle');
      // سقفِ سهمیه خطای شبکه نیست: به‌جای متنِ قرمزِ ریز، برگه‌ی ارتقا باز
      // می‌شود که می‌گوید چقدر مصرف شده، کِی تازه می‌شود و چه چیزی بازش می‌کند.
      if (e instanceof ApiError && quotaKeyForError(e.code) === 'random') {
        setLimitHit(true);
        refreshQuota();
        return;
      }
      setError('پیوستن ناموفق بود. دوباره تلاش کن.');
    }
  }, [gender, uc, consumeQuota, refreshQuota]);

  const leave = useCallback(async () => {
    try {
      await uc.random.leave();
    } catch {}
    setState('idle');
  }, [uc]);

  return {
    gender,
    setGender,
    state,
    error,
    join,
    leave,
    limitHit,
    dismissLimit: () => setLimitHit(false),
  };
}
