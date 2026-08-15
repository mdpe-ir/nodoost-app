import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

/** حالتِ رهای پس‌زمینه‌ی دکمه‌ی بازگشت — `surface` با آلفای صفر. */
const BACK_IDLE = 'rgba(22,18,28,0)';

/**
 * هدرِ صفحاتِ پوش‌شده (استک) — دکمه‌ی بازگشت سمتِ راست (قراردادِ RTL) + عنوان.
 */
export function StackHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.head}>
      <PressableScale
        hitSlop={10}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="بازگشت"
        scaleTo={0.88}
        feedback="select"
        bg={BACK_IDLE}
        bgPressed={colors.surface}
        style={styles.back}
      >
        {/* در RTL بازگشت به سمتِ راست است — شورونِ رو به راست */}
        <Icon name="chevron-next" size={22} tint="white" />
      </PressableScale>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  trailing: { minWidth: 36, alignItems: 'flex-start' },
});
