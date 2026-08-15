import React from 'react';
import { Text, View } from 'react-native';

import { PressableScale } from './PressableScale';
import { colors, fonts, radius } from '@/core/theme';
import type { Rank } from '@/domain/entities';

/** ته‌رنگِ کم‌رنگ از رنگِ رتبه — همان الگوی TierBadge. */
const tint = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(154,147,165,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * نشانِ رتبه — همان چیزی که دیگران در پروفایلِ عمومی می‌بینند.
 *
 * عمداً عددِ امتیاز را نشان نمی‌دهد: مقایسه‌ی مستقیمِ عدد برای کاربرِ تازه‌وارد
 * ضدانگیزه است. عدد فقط در صفحه‌ی «امتیازِ من» و برای خودِ کاربر دیده می‌شود.
 */
export function RankBadge({
  rank,
  height = 22,
  onPress,
}: {
  rank?: Rank | null;
  height?: number;
  onPress?: () => void;
}) {
  if (!rank) return null;
  const color = rank.color || colors.tierNormal;
  const dot = Math.max(5, Math.round(height * 0.3));

  const body = (
    <View
      style={{
        height,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Math.round(height * 0.22),
        paddingHorizontal: Math.round(height * 0.38),
        borderRadius: radius.pill,
        backgroundColor: tint(color, 0.14),
        borderWidth: 1,
        borderColor: tint(color, 0.4),
      }}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: Math.max(10, Math.round(height * 0.52)),
          lineHeight: height,
          color,
          writingDirection: 'rtl',
        }}
        numberOfLines={1}
      >
        {rank.name}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`رتبه: ${rank.name}`}
      scaleTo={0.92}
      feedback="select"
    >
      {body}
    </PressableScale>
  );
}
