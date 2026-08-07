import { useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { Tier } from '@/domain/entities';

/**
 * کاتالوگِ سطح‌ها با کشِ درون‌حافظه‌ای.
 *
 * چرا کش: پنجره‌ی ارتقا حالا از چند صفحه باز می‌شود (کاوش، شانسی، گفتگو، نقشه).
 * بدونِ کش، هر بار که یکی از آن صفحه‌ها رندر می‌شد یک ‎/api/tiers‎ تازه می‌رفت —
 * برای داده‌ای که در یک نشست تقریباً هرگز عوض نمی‌شود.
 *
 * بعد از خرید باید invalidate شود؛ قابلیتِ خریدِ کارت‌ها با سطحِ تازه فرق می‌کند.
 */

let cache: Tier[] | null = null;
let inflight: Promise<Tier[]> | null = null;

export const invalidateTierCatalog = () => {
  cache = null;
  inflight = null;
};

export function useTierCatalog(): { tiers: Tier[]; loading: boolean } {
  const uc = useCases();
  const [tiers, setTiers] = useState<Tier[]>(cache ?? []);
  const [loading, setLoading] = useState(cache == null);

  useEffect(() => {
    let alive = true;
    // کشِ گرم: state از همان‌جا مقداردهیِ اولیه شده، پس این‌جا کاری نمانده.
    if (cache) return;
    inflight =
      inflight ??
      uc.catalog.getTiers().then((t) => {
        cache = t;
        inflight = null;
        return t;
      });
    inflight
      .then((t) => {
        if (alive) setTiers(t);
      })
      .catch(() => {
        inflight = null;
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uc]);

  return { tiers, loading };
}
