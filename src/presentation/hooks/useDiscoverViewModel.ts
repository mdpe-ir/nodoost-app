import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { quotaKeyForError } from '@/presentation/tiers/quotaCopy';
import { ApiError } from '@/core/http/ApiError';
import { resolveLocation } from '@/core/utils/location';
import { recordInstallNagAction } from '@/core/installNag';
import type { Candidate, MatchResult } from '@/domain/entities';

/**
 * ویومدلِ کاوش. کارت‌ها بلافاصله بارگذاری می‌شوند و موقعیت در پس‌زمینه ست
 * می‌شود؛ پس صفحه هیچ‌وقت منتظرِ GPS بلاک نمی‌ماند.
 *
 * اگر موقعیتِ کاربر ست نشود، او در کاوشِ دیگران دیده نمی‌شود؛ در آن حالت
 * `needsLocation` روشن می‌شود تا صفحه یک نکته‌ی راهنما نشان دهد.
 */
export function useDiscoverViewModel() {
  const uc = useCases();
  const [cards, setCards] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  /** سقفِ پسندِ روزانه همین حالا خورد — صفحه با آن برگه‌ی ارتقا را باز می‌کند. */
  const [limitHit, setLimitHit] = useState(false);
  const { consume: consumeQuota, refresh: refreshQuota } = useQuota();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const list = await uc.discovery.getCandidates();
        setCards(list);
        setIndex(0);
      } catch (e) {
        setCards([]);
        setError(e instanceof ApiError ? e.code ?? `HTTP ${e.status}` : 'network');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [uc]
  );

  // تلاش برای گرفتنِ موقعیت و ذخیره‌ی آن. اگر مجوز نبود، `needsLocation` روشن می‌ماند.
  const captureLocation = useCallback(
    async (interactive = false): Promise<boolean> => {
      const res = await resolveLocation(interactive);
      if (!res.ok) {
        // فقط ردِ مجوز نکته‌ی «موقعیت روشن نیست» را نشان می‌دهد؛ اگر مجوز هست ولی fix
        // نشد (unavailable)، کاربر را با پیامِ اشتباه نمی‌ترسانیم — تلاشِ بعدی ست‌اش می‌کند.
        if (res.reason === 'denied') setNeedsLocation(true);
        return false;
      }
      setNeedsLocation(false);
      await uc.profile.setLocation(res.coords.lat, res.coords.lng).catch(() => {});
      return true;
    },
    [uc]
  );

  useEffect(() => {
    let alive = true;
    load();
    (async () => {
      // اگر موقعیتِ کاربر قبلاً ست نشده، در پس‌زمینه تلاش کن؛ در غیرِ این صورت نکته را نشان بده.
      let hasLocation = false;
      try {
        const me = await uc.profile.getMe();
        hasLocation = me?.hasLocation ?? false;
      } catch {}
      if (!alive || hasLocation) return;
      const ok = await captureLocation(false);
      if (alive && ok) load(true);
    })();
    return () => {
      alive = false;
    };
  }, [uc, load, captureLocation]);

  // با بازگشت به تب یا بازکردنِ دوباره‌ی اپ، بی‌صدا کارت‌های تازه بگیر.
  useRefetchOnFocus(useCallback(() => load(true), [load]));

  const current = cards[index];

  const swipe = useCallback(
    async (action: 'like' | 'pass') => {
      const target = cards[index];
      if (!target) return;
      setIndex((i) => i + 1);
      try {
        const result = await uc.discovery.swipe(target.id, action);
        if (action === 'like') {
          recordInstallNagAction();
          consumeQuota('like');
        }
        if (action === 'like' && (result.peer || result.matchId)) {
          setMatch({ matchId: result.matchId, peer: result.peer ?? target });
        }
      } catch (e) {
        // سقفِ پسندِ روزانه تا امروز بی‌صدا بلعیده می‌شد: کارت رد می‌شد، هیچ
        // اتفاقی نمی‌افتاد و کاربر فکر می‌کرد اپ خراب است. حالا کارت برمی‌گردد
        // و برگه‌ی ارتقا دلیل را می‌گوید.
        if (e instanceof ApiError && quotaKeyForError(e.code) === 'like') {
          setIndex((i) => Math.max(0, i - 1));
          setLimitHit(true);
          refreshQuota();
        }
      }
    },
    [cards, index, uc, consumeQuota, refreshQuota]
  );

  const enableLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    const ok = await captureLocation(true);
    setLocating(false);
    if (ok) load(true);
  }, [locating, captureLocation, load]);

  return {
    current,
    loading,
    error,
    match,
    needsLocation,
    locating,
    swipe,
    enableLocation,
    limitHit,
    dismissLimit: () => setLimitHit(false),
    reload: () => load(),
    dismissMatch: () => setMatch(null),
  };
}
