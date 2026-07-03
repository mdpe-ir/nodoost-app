import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Icon } from '@/presentation/components/Icon';
import { usePwaInstall } from '@/presentation/providers/PwaInstallProvider';
import { colors, fonts, fontSizes, radius, spacing } from '@/core/theme';

/**
 * دکمه‌ی نصبِ اپ در هدر (فقط وب و فقط وقتی قابلِ نصب است).
 * روی نیتیو یا وقتی اپ نصب شده/در حالتِ standalone است، چیزی رندر نمی‌شود.
 */
export function InstallButton() {
  const { canInstall, requestInstall } = usePwaInstall();
  if (!canInstall) return null;

  return (
    <Pressable
      onPress={requestInstall}
      accessibilityRole="button"
      accessibilityLabel="نصبِ اپلیکیشن"
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Icon name="plus" size={14} tint="gold" />
      <Text style={styles.label}>نصبِ اپ</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
});
