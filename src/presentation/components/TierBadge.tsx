import React from 'react';
import { Text, View } from 'react-native';

import { colors, fonts, radius } from '../../core/theme';

/**
 * سطح‌بندیِ پنج‌گانه: ۱=عادی(رایگان) ۲=برنزی ۳=نقره‌ای ۴=طلایی ۵=الماس.
 * سطحِ هر کاربر همه‌جا کنارِ نامش دیده می‌شود؛ قانونِ پیام هم بر همین اساس است
 * (شروعِ گفتگو فقط با هم‌سطح یا پایین‌تر).
 */
const TIERS: Record<number, { name: string; color: string }> = {
  1: { name: 'عادی', color: colors.tierNormal },
  2: { name: 'برنزی', color: colors.tierBronze },
  3: { name: 'نقره‌ای', color: colors.tierSilver },
  4: { name: 'طلایی', color: colors.tierGold },
  5: { name: 'الماس', color: colors.tierDiamond },
};

export const tierName = (t: number): string => TIERS[t]?.name ?? '';
export const tierColor = (t: number): string => TIERS[t]?.color ?? colors.tierNormal;

/** ته‌رنگِ کم‌رنگ برای پس‌زمینه/قابِ پیل از روی رنگِ اصلیِ سطح. */
const tint = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export function TierBadge({ tier, height = 22 }: { tier: number; height?: number }) {
  const t = TIERS[tier];
  if (!t) return null;
  const dot = Math.max(5, Math.round(height * 0.3));
  return (
    <View
      style={{
        height,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Math.round(height * 0.22),
        paddingHorizontal: Math.round(height * 0.38),
        borderRadius: radius.pill,
        backgroundColor: tint(t.color, 0.14),
        borderWidth: 1,
        borderColor: tint(t.color, 0.4),
      }}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: t.color }} />
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: Math.max(10, Math.round(height * 0.52)),
          lineHeight: height,
          color: t.color,
          writingDirection: 'rtl',
        }}
        numberOfLines={1}
      >
        {t.name}
      </Text>
    </View>
  );
}
