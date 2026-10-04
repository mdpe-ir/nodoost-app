import type { AgeRange } from '@/domain/entities';
import { faNum } from '@/core/utils/faNum';

/**
 * دروازه‌ی فیلترِ بازه‌ی سن در کاوش و نقشه — از `GET /api/config` `age_filter`.
 * ارزیابیِ اپ فقط برای نمایشِ UI است و سرور همچنان مرجعِ نهاییِ مجوز است.
 */
export interface AgeFilterGate {
  enabled: boolean;
  minTier: number | null;
}

/** اگر پیکربندی نرسید، فیلترِ سن از برنزی باز است. */
export const emptyAgeFilter = (): AgeFilterGate => ({
  enabled: true,
  minTier: 2,
});

export const parseAgeFilter = (raw: unknown): AgeFilterGate => {
  const base = emptyAgeFilter();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const min = o.min_tier;
  return {
    enabled: o.enabled !== false,
    minTier: typeof min === 'number' ? min : min === null ? null : base.minTier,
  };
};

export const ageFilterOpen = (gate: AgeFilterGate, myTier: number): boolean =>
  gate.enabled && (gate.minTier == null || myTier >= gate.minTier);

export interface AgeRangeOption {
  key: string;
  label: string;
  range?: AgeRange;
}

export const AGE_RANGE_OPTIONS: AgeRangeOption[] = [
  { key: 'all', label: 'همه' },
  { key: '18-25', label: `${faNum(18)} تا ${faNum(25)} سال`, range: { min: 18, max: 25 } },
  { key: '25-35', label: `${faNum(25)} تا ${faNum(35)} سال`, range: { min: 25, max: 35 } },
  { key: '35-45', label: `${faNum(35)} تا ${faNum(45)} سال`, range: { min: 35, max: 45 } },
  { key: '45+', label: `${faNum(45)}+ سال`, range: { min: 45 } },
];

export function isSameAgeRange(a?: AgeRange | null, b?: AgeRange | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.min === b.min && a.max === b.max;
}

export function formatAgeRangeLabel(range?: AgeRange | null): string | null {
  if (!range || (range.min == null && range.max == null)) return null;
  const match = AGE_RANGE_OPTIONS.find((o) => o.range && isSameAgeRange(o.range, range));
  if (match) return match.label;
  if (range.min != null && range.max != null) {
    return `${faNum(range.min)} تا ${faNum(range.max)} سال`;
  }
  if (range.min != null) {
    return `${faNum(range.min)}+ سال`;
  }
  if (range.max != null) {
    return `تا ${faNum(range.max)} سال`;
  }
  return null;
}
