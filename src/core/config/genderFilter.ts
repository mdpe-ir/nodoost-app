/**
 * دروازه‌ی فیلترِ جنسیت در کاوش و چهره‌نما — از `GET /api/config` `gender_filter`.
 * همان شکلِ دروازه‌ی چت (enabled + min_tier)؛ ارزیابی سمتِ اپ فقط برای UI است،
 * سرور دوباره می‌سنجد.
 */

export interface GenderFilterGate {
  enabled: boolean;
  minTier: number | null;
}

/** اگر /config نیاید: برنزی به بالا — هم‌قرارداد با seedِ فلگ. */
export const emptyGenderFilter = (): GenderFilterGate => ({
  enabled: true,
  minTier: 2,
});

export const parseGenderFilter = (raw: unknown): GenderFilterGate => {
  const base = emptyGenderFilter();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const min = o.min_tier;
  return {
    enabled: o.enabled !== false,
    minTier: typeof min === 'number' ? min : min === null ? null : base.minTier,
  };
};

export const genderFilterOpen = (gate: GenderFilterGate, myTier: number): boolean =>
  gate.enabled && (gate.minTier == null || myTier >= gate.minTier);

/** پیش‌فرضِ کاوش: جنسِ مقابل؛ اگر جنسیت نامشخص باشد همه. */
export const oppositeGenderFilter = (gender?: string): 'f' | 'm' | 'all' => {
  if (gender === 'm') return 'f';
  if (gender === 'f') return 'm';
  return 'all';
};
