import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

interface Props {
  peerName?: string;
  peerPhotoUrl?: string;
  onChat: () => void;
  onDismiss: () => void;
}

/**
 * جشنِ مچ — پوششِ تمام‌صفحه با هاله‌ی طلایی و دو آواتارِ درهم‌رفته (تو + او).
 * تنها لحظه‌ی «پر زرق‌وبرق» اپ؛ بقیه‌ی رابط عمداً آرام است.
 */
export function MatchOverlay({ peerName, peerPhotoUrl, onChat, onDismiss }: Props) {
  const { user } = useSession();
  const myPhoto = user?.photos?.find((p) => p.isPrimary)?.url ?? user?.photos?.[0]?.url;

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.card}>
        <View style={styles.glowWrap} pointerEvents="none">
          <Image
            source={require('../../../assets/images/logo-glow.png')}
            style={styles.glow}
            contentFit="contain"
          />
        </View>

        <Animated.View entering={ZoomIn.delay(140).springify()} style={styles.pair}>
          <View style={[styles.avatarTilt, styles.tiltRight]}>
            <Avatar uri={myPhoto} name={user?.name} size={104} ring />
          </View>
          <View style={[styles.avatarTilt, styles.tiltLeft]}>
            <Avatar uri={peerPhotoUrl} name={peerName} size={104} ring />
          </View>
        </Animated.View>

        <Text style={styles.kicker}>هر دو همدیگر را پسندیدید</Text>
        <Text style={styles.title}>{peerName ? `با ${peerName} مَچ شدی!` : 'مَچ شدید!'}</Text>

        <Button label="شروعِ گفتگو" onPress={onChat} style={styles.cta} />
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityRole="button">
          <Text style={styles.later}>بعداً</Text>
        </Pressable>
      </Animated.View>
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
  card: { alignItems: 'center' },
  glowWrap: { position: 'absolute', top: -110, alignItems: 'center', width: '100%' },
  glow: { width: 330, height: 330, opacity: 0.5 },
  pair: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatarTilt: {
    borderRadius: 60,
    backgroundColor: colors.bg,
    padding: 3,
  },
  tiltRight: { transform: [{ rotate: '-7deg' }], zIndex: 1 },
  tiltLeft: { transform: [{ rotate: '7deg' }], marginRight: -26 },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    marginTop: spacing.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.gold2,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  cta: { alignSelf: 'stretch', minWidth: 240 },
  later: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
