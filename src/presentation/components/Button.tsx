import React from 'react';
import { Text, ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, fonts, fontSizes, radius, spacing, gradients, shadow } from '@/core/theme';

type Variant = 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const HEIGHTS: Record<Size, number> = { lg: 52, md: 44, sm: 36 };

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** آیکنِ برند در آغازِ (راستِ) دکمه. */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** شدتِ لرزش. برای تأییدهای سنگین (خرید، حذف) `commit` بده. */
  feedback?: 'select' | 'tap' | 'commit' | 'none';
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'gold',
  size = 'lg',
  icon,
  loading,
  disabled,
  feedback = 'tap',
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const gold = variant === 'gold';
  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      // دکمه‌ی پهن اگر به همان نسبتِ دکمه‌ی دایره‌ای کوچک شود، جابه‌جاییِ لبه‌اش
      // زیاد و ناخوشایند می‌شود.
      scaleTo={0.97}
      feedback={feedback}
      style={[
        styles.base,
        { height: HEIGHTS[size] },
        gold ? shadow.gold : styles[variant],
        isDisabled && styles.disabled,
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
      {loading ? (
        <ActivityIndicator color={gold ? colors.onGold : colors.gold} />
      ) : (
        <View style={styles.center}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 17} tint={gold ? 'ink' : 'gold'} /> : null}
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              gold ? styles.labelOnGold : variant === 'danger' ? styles.labelDanger : styles.labelOther,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  center: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  ghost: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  danger: { backgroundColor: colors.roseFaint, borderWidth: 1, borderColor: colors.rose },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  labelSm: { fontSize: fontSizes.sm },
  labelOnGold: { color: colors.onGold },
  labelOther: { color: colors.ink },
  labelDanger: { color: colors.rose },
});
