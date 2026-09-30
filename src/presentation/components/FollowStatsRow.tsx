import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

/** شمارنده‌ی قابلِ ضربه‌ی «دنبال‌کننده/دنبال‌شده». */
function FollowStat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${faNum(value)}`}
      style={styles.stat}
    >
      <Text style={styles.value}>{faNum(value)}</Text>
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

/**
 * گرافِ دنبال‌کردن — دو شمارنده‌ی قابلِ ضربه که فهرستِ کامل را باز می‌کنند.
 *
 * دنبال‌کردن برای همه‌ی سطح‌ها رایگان است؛ این ناحیه هیچ قفلِ اشتراکی ندارد.
 * در دو جا استفاده می‌شود (پروفایلِ اجتماعی و اطلاعاتِ مخاطبِ گفتگو) و به همین
 * دلیل جدا شده تا شمارش و چیدمانش یک منبع داشته باشد.
 */
export function FollowStatsRow({
  followersCount,
  followingCount,
  onOpen,
  style,
}: {
  followersCount: number;
  followingCount: number;
  onOpen: (tab: 'followers' | 'following') => void;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View style={[styles.row, style]}>
      <FollowStat
        value={followersCount}
        label="دنبال‌کننده"
        onPress={() => onOpen('followers')}
      />
      <View style={styles.divider} />
      <FollowStat
        value={followingCount}
        label="دنبال‌شده"
        onPress={() => onOpen('following')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: colors.line, marginHorizontal: spacing.md },
  stat: { alignItems: 'center' },
  value: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink },
  label: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
});
