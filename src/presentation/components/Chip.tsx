import React from 'react';
import { Text, StyleSheet, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      scaleTo={0.94}
      feedback="select"
      style={[styles.base, active && styles.active, style]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </PressableScale>
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
    borderTopColor: colors.rim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink2 },
  labelActive: { color: colors.gold2 },
});
