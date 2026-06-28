import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '@/core/theme';

type Variant = 'gold' | 'outline' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'gold', loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'gold' ? colors.onGold : colors.gold} />
      ) : (
        <Text style={[styles.label, variant === 'gold' ? styles.labelOnGold : styles.labelOther]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  gold: { backgroundColor: colors.gold },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.roseFaint, borderWidth: 1, borderColor: colors.rose },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  labelOnGold: { color: colors.onGold },
  labelOther: { color: colors.ink },
});
