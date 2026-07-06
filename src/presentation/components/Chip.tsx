import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, radius } from '@/core/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/** چیپِ انتخابی — برای فیلترها و گزینه‌های تک‌انتخابی (جنسیت و…). */
export function Chip({ label, active, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.base,
        active && styles.active,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink2 },
  labelActive: { color: colors.gold2 },
});
