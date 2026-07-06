import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './Icon';
import { colors, gradients, shadow } from '@/core/theme';

type Variant = 'surface' | 'gold' | 'ghost';

interface Props {
  icon: IconName;
  onPress: () => void;
  /** قطرِ دایره. */
  size?: number;
  iconSize?: number;
  variant?: Variant;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}

/** دکمه‌ی دایره‌ایِ آیکنی — برای کنش‌های پسند/رد، تازه‌سازی، بستن و… */
export function IconButton({
  icon,
  onPress,
  size = 56,
  iconSize,
  variant = 'surface',
  disabled,
  accessibilityLabel,
  style,
}: Props) {
  const gold = variant === 'gold';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        styles[variant],
        gold && shadow.gold,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {gold ? (
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Icon
        name={icon}
        size={iconSize ?? Math.round(size * 0.44)}
        tint={gold ? 'ink' : variant === 'ghost' ? 'gold' : 'white'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  gold: {},
  ghost: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },
});
