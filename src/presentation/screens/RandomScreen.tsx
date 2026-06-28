import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { useRandomViewModel } from '@/presentation/hooks/useRandomViewModel';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

const OPTIONS: { key: '' | 'f' | 'm'; label: string }[] = [
  { key: '', label: 'فرقی نداره' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export function RandomScreen() {
  const vm = useRandomViewModel();
  const waiting = vm.state === 'waiting';

  const scale = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [scale]);
  useEffect(() => {
    ring.value = waiting
      ? withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false)
      : withTiming(0, { duration: 200 });
  }, [waiting, ring]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  return (
    <ScreenContainer>
      <Text style={styles.title}>تصادفی</Text>
      <Text style={styles.sub}>با یک غریبه‌ی نزدیک، گفتگوی زنده را شروع کن</Text>

      <View style={styles.center}>
        <View style={styles.orbWrap}>
          {waiting ? <Animated.View style={[styles.pulseRing, ringStyle]} /> : null}
          <Animated.View style={[styles.orb, orbStyle]}>
            <LinearGradient
              colors={['rgba(218,184,119,0.18)', 'rgba(218,184,119,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.orbInner}>
              <Text style={styles.orbText}>{waiting ? 'در حالِ پیدا کردن…' : 'آماده‌ای؟'}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {!waiting ? (
        <>
          <Text style={styles.label}>ترجیحِ جنسیتِ هم‌صحبت</Text>
          <View style={styles.row}>
            {OPTIONS.map((o) => {
              const active = vm.gender === o.key;
              return (
                <Pressable
                  key={o.key || 'any'}
                  onPress={() => vm.setGender(o.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button label="شروعِ گفتگوی تصادفی" onPress={vm.join} style={styles.action} />
        </>
      ) : (
        <Button label="لغو" onPress={vm.leave} variant="outline" style={styles.action} />
      )}
      {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold, textAlign: 'right', marginTop: spacing.sm },
  sub: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, textAlign: 'right', marginTop: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: colors.goldSoft },
  orb: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orbInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  orbText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2, textAlign: 'center' },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right', marginBottom: spacing.md },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  chipText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  chipTextActive: { color: colors.gold2 },
  action: { marginTop: spacing.xl },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, textAlign: 'center', marginTop: spacing.md },
});
