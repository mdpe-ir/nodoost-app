import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, springs } from '@/core/theme';

interface Props {
  count: number;
  index: number;
  /** `dots` نقطه‌ای که کش می‌آید، `bars` نوارِ پیشرفتِ گام‌به‌گام. */
  variant?: 'dots' | 'bars';
  style?: StyleProp<ViewStyle>;
}

/**
 * نشانگرِ گام — هم برای تورِ معرفی (نقطه) هم برای ثبت‌نام (نوار).
 *
 * چرا فنر: این تنها بازخوردِ «حرکت کردم» در صفحه‌ای است که بقیه‌اش ثابت است.
 * وقتی نقطه‌ی فعال بی‌انیمیشن جابه‌جا می‌شود، پیشرفت حس نمی‌شود — کاربر
 * می‌بیند که چیزی عوض شد ولی حرکتی نمی‌بیند، و همین صفحه را ایستا نشان
 * می‌دهد.
 */
export function StepDots({ count, index, variant = 'dots', style }: Props) {
  return (
    <View style={[variant === 'dots' ? styles.dotsRow : styles.barsRow, style]}>
      {Array.from({ length: count }, (_, i) => (
        <Step key={i} active={variant === 'dots' ? i === index : i <= index} variant={variant} />
      ))}
    </View>
  );
}

/**
 * یک نقطه‌ی تنها — وقتی لازم است هر نقطه خودش قابلِ فشار باشد و نمی‌شود کلِ
 * ردیف را به `StepDots` سپرد (مثلِ تورِ معرفی که با زدنِ نقطه به اسلاید می‌رود).
 */
export function StepDot({ active }: { active: boolean }) {
  return <Step active={active} variant="dots" />;
}

function Step({ active, variant }: { active: boolean; variant: 'dots' | 'bars' }) {
  const style = useAnimatedStyle(() => {
    if (variant === 'bars') {
      return { backgroundColor: withSpring(active ? colors.gold : colors.surface2, springs.snappy) };
    }
    return {
      width: withSpring(active ? 22 : 7, springs.snappy),
      backgroundColor: withSpring(active ? colors.gold : colors.surface2, springs.snappy),
    };
  });

  return <Animated.View style={[variant === 'bars' ? styles.bar : styles.dot, style]} />;
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  barsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
});
