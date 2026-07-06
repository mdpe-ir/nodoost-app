import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

/**
 * هدرِ صفحاتِ پوش‌شده (استک) — دکمه‌ی بازگشت سمتِ راست (قراردادِ RTL) + عنوان.
 */
export function StackHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.head}>
      <Pressable
        hitSlop={10}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="بازگشت"
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        {/* در RTL بازگشت به سمتِ راست است — شورونِ رو به راست */}
        <Icon name="chevron-next" size={22} tint="white" />
      </Pressable>
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
  backPressed: { backgroundColor: colors.surface },
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
