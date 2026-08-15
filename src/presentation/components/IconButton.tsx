import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
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
  /** شدتِ لرزش. برای کنش‌های برگشت‌ناپذیر (پسند/رد) `commit` بده. */
  feedback?: 'select' | 'tap' | 'commit' | 'none';
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
  feedback = 'tap',
  style,
}: Props) {
  const gold = variant === 'gold';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      // دایره‌های بزرگ باید کمتر کوچک شوند تا حرکت اغراق‌آمیز نشود.
      scaleTo={0.9}
      feedback={feedback}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        styles[variant],
        gold && shadow.gold,
        disabled && styles.disabled,
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
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  gold: {},
  ghost: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  disabled: { opacity: 0.5 },
});
