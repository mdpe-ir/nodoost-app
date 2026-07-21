import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { Icon } from '@/presentation/components/Icon';
import { TierLockModal } from '@/presentation/components/TierLockModal';
import { useRandomViewModel } from '@/presentation/hooks/useRandomViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

const OPTIONS: { key: '' | 'f' | 'm'; label: string }[] = [
  { key: '', label: 'فرقی نداره' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export function RandomScreen() {
  const vm = useRandomViewModel();
  const { user } = useSession();
  const waiting = vm.state === 'waiting';
  // فیلترِ جنسیت فقط برای برنزی به بالا — سرور هم برای سطحِ ۱ آن را نادیده می‌گیرد.
  const canFilter = (user?.tier ?? 1) >= 2;
  const [genderLock, setGenderLock] = useState(false);

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
      <ScreenHeader title="تصادفی" subtitle="با یک غریبه‌ی نزدیک، گفتگوی زنده را شروع کن" />

      <View style={styles.center}>
        <View style={styles.orbWrap}>
          {waiting ? <Animated.View style={[styles.pulseRing, ringStyle]} /> : null}
          <Animated.View style={[styles.orb, orbStyle]}>
            <LinearGradient
              colors={['rgba(218,184,119,0.18)', 'rgba(218,184,119,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.orbInner}>
              <Icon name={waiting ? 'clock' : 'lightning-fill'} size={26} tint="gold" />
              <Text style={styles.orbText}>{waiting ? 'در حالِ پیدا کردن…' : 'آماده‌ای؟'}</Text>
            </View>
          </Animated.View>
        </View>
        {waiting ? (
          <Text style={styles.waitHint}>به‌محضِ پیدا شدنِ هم‌صحبت، گفتگو خودکار باز می‌شود.</Text>
        ) : null}
      </View>

      {!waiting ? (
        <>
          <Text style={styles.label}>ترجیحِ جنسیتِ هم‌صحبت</Text>
          <View style={[styles.row, !canFilter && styles.rowLocked]}>
            {OPTIONS.map((o) => (
              <Chip
                key={o.key || 'any'}
                label={canFilter || !o.key ? o.label : `${o.label} · قفل`}
                active={canFilter ? vm.gender === o.key : !o.key}
                onPress={() =>
                  canFilter || !o.key ? vm.setGender(o.key) : setGenderLock(true)
                }
                style={styles.chip}
              />
            ))}
          </View>
          {!canFilter ? (
            <Text style={styles.lockHint}>فیلترِ جنسیت از سطحِ برنزی باز می‌شود — برای فعال‌سازی سطحت را ارتقا بده.</Text>
          ) : null}
          <Button label="شروعِ گفتگوی تصادفی" icon="lightning-fill" onPress={vm.join} style={styles.action} />
        </>
      ) : (
        <Button label="لغو" onPress={vm.leave} variant="outline" style={styles.action} />
      )}
      {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}

      <TierLockModal
        visible={genderLock}
        requiredTier={2}
        title="فیلترِ جنسیت قفل است"
        message="انتخابِ جنسیتِ هم‌صحبت از سطحِ برنزی باز می‌شود. برای استفاده، حسابت را ارتقا بده."
        feature="فیلترِ جنسیتِ هم‌صحبت"
        onClose={() => setGenderLock(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.goldSoft,
  },
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
    gap: spacing.sm,
    paddingHorizontal: 14,
  },
  orbText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.gold2,
    textAlign: 'center',
  },
  waitHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 260,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  rowLocked: { opacity: 0.6 },
  chip: { flex: 1 },
  lockHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  action: { marginTop: spacing.xl, marginBottom: spacing.md },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
