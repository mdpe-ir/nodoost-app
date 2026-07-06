import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';
import { InstallButton } from '@/presentation/components/InstallButton';

/** حاشیه‌ی افقیِ استانداردِ صفحات — برای محاسبه‌ی عرضِ سلول‌ها هم استفاده می‌شود. */
export const PAGE_PADDING = 18;

interface Props {
  children: React.ReactNode;
  /** اگر true باشد padding افقیِ پیش‌فرض اعمال نمی‌شود (برای فهرست‌های تمام‌عرض). */
  flush?: boolean;
  style?: ViewStyle;
}

/** قابِ پایه‌ی صفحه: پس‌زمینه‌ی تیره + رعایتِ ناحیه‌ی امن. */
export function ScreenContainer({ children, flush, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + spacing.sm }, !flush && styles.padded, style]}
    >
      {children}
    </View>
  );
}

/** هدرِ یک‌دستِ صفحات — عنوانِ بزرگِ طلایی (راست‌چین) + کنشِ اختیاری در سمتِ چپ. */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.head}>
      {action ?? <InstallButton />}
      <View style={styles.headText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: PAGE_PADDING },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headText: { flexShrink: 1, alignItems: 'flex-end' },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 38,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
