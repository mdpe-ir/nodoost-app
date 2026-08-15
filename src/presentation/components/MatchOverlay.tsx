import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { haptics } from '@/core/haptics';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, durations, easings, fonts, fontSizes, lineHeights, spacing, springs } from '@/core/theme';

interface Props {
  peerName?: string;
  peerPhotoUrl?: string;
  onChat: () => void;
  onDismiss: () => void;
}

/**
 * جشنِ مچ — تنها لحظه‌ی پرزرق‌وبرقِ اپ؛ بقیه‌ی رابط عمداً آرام است.
 *
 * توالی عمدی است، نه تزیین: اول هاله باز می‌شود (جا خالی می‌کند)، بعد دو
 * آواتار از دو طرفِ صفحه به هم می‌رسند (این خودِ خبر است: دو نفر به هم
 * رسیدند)، و آخر متن و دکمه می‌آیند. اگر همه با هم ظاهر شوند، چشم فقط یک
 * پنجره می‌بیند؛ با توالی، یک اتفاق می‌بیند.
 *
 * لرزشِ موفقیت هم‌زمان با رسیدنِ آواتارهاست، نه با بازشدنِ پنجره — بازخوردِ
 * لمسی باید روی نقطه‌ی اوج بنشیند.
 */
export function MatchOverlay({ peerName, peerPhotoUrl, onChat, onDismiss }: Props) {
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const myPhoto = user?.photos?.find((p) => p.isPrimary)?.url ?? user?.photos?.[0]?.url;

  /** ۰ = آواتارها بیرونِ قاب، ۱ = رسیده‌اند. */
  const meet = useSharedValue(0);
  /** بزرگ‌شدنِ هاله پشتِ سر. */
  const halo = useSharedValue(0);

  useEffect(() => {
    halo.value = withTiming(1, { duration: durations.slow, easing: easings.enter });
    meet.value = withDelay(140, withSpring(1, springs.bouncy));
    const t = setTimeout(() => haptics.success(), 300);
    return () => clearTimeout(t);
  }, [halo, meet]);

  // فاصله‌ی پرتاب: از لبه‌ی صفحه، تا حرکت روی هر عرضی یک‌جور دیده شود.
  const travel = width * 0.55;

  const mine = useAnimatedStyle(() => ({
    opacity: meet.value,
    transform: [
      { translateX: travel * (1 - meet.value) },
      { rotate: `${-7 * meet.value}deg` },
    ],
  }));
  const theirs = useAnimatedStyle(() => ({
    opacity: meet.value,
    transform: [
      { translateX: -travel * (1 - meet.value) },
      { rotate: `${7 * meet.value}deg` },
    ],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value * 0.55,
    transform: [{ scale: 0.7 + halo.value * 0.3 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(durations.quick)} style={styles.overlay}>
      <View style={styles.card}>
        <Animated.View style={[styles.glowWrap, haloStyle]} pointerEvents="none">
          <Image
            source={require('../../../assets/images/logo-glow.png')}
            style={styles.glow}
            contentFit="contain"
          />
        </Animated.View>

        <View style={styles.pair}>
          <Animated.View style={[styles.avatarTilt, styles.tiltRight, mine]}>
            <Avatar uri={myPhoto} name={user?.name} size={104} ring />
          </Animated.View>
          <Animated.View style={[styles.avatarTilt, styles.tiltLeft, theirs]}>
            <Avatar uri={peerPhotoUrl} name={peerName} size={104} ring />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(360).duration(durations.base)} style={styles.text}>
          <Text style={styles.kicker}>هر دو همدیگر را پسندیدید</Text>
          <Text style={styles.title}>{peerName ? `با ${peerName} مَچ شدی!` : 'مَچ شدید!'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(480).duration(durations.base)} style={styles.foot}>
          <Button label="شروعِ گفتگو" onPress={onChat} feedback="commit" style={styles.cta} />
          <Pressable onPress={onDismiss} hitSlop={10} accessibilityRole="button">
            <Text style={styles.later}>بعداً</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 20,
  },
  card: { alignItems: 'center', alignSelf: 'stretch' },
  glowWrap: { position: 'absolute', top: -110, alignItems: 'center', width: '100%' },
  glow: { width: 330, height: 330 },
  pair: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatarTilt: {
    borderRadius: 60,
    backgroundColor: colors.bg,
    padding: 3,
  },
  tiltRight: { zIndex: 1 },
  tiltLeft: { marginRight: -26 },
  text: { alignItems: 'center', marginTop: spacing.xl },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
  },
  title: {
    fontFamily: fonts.bold,
    // پله‌ی نمایشی: بزرگ‌ترین متنِ کلِ اپ، برای بزرگ‌ترین لحظه‌ی کلِ اپ.
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    color: colors.gold2,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  foot: { alignSelf: 'stretch', alignItems: 'center', marginTop: spacing.xl },
  cta: { alignSelf: 'stretch', minWidth: 240 },
  later: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
