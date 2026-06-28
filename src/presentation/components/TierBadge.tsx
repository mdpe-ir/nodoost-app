import React from 'react';
import { Image } from 'expo-image';

const NAMES: Record<number, string> = { 1: 'نقره‌ای', 2: 'طلایی', 3: 'پلاتینیوم', 4: 'الماس' };

/* eslint-disable @typescript-eslint/no-require-imports */
const BADGES: Record<number, number> = {
  1: require('../../../assets/badges/tier-silver.png'),
  2: require('../../../assets/badges/tier-gold.png'),
  3: require('../../../assets/badges/tier-platinum.png'),
  4: require('../../../assets/badges/tier-diamond.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// نسبتِ ابعادِ تصویرِ بَج ۶۲۰×۱۹۰
const RATIO = 620 / 190;

export const tierName = (t: number): string => NAMES[t] ?? '';

export function TierBadge({ tier, height = 22 }: { tier: number; height?: number }) {
  if (!tier || tier < 2) return null;
  const src = BADGES[tier];
  if (!src) return null;
  return (
    <Image
      source={src}
      style={{ height, width: height * RATIO }}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
}
