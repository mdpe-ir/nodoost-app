import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/core/theme';

/**
 * اسپلشِ متحرکِ درون‌برنامه‌ای — بعد از اسپلشِ نیتیو پخش می‌شود و
 * با محو شدن، اپ را نمایان می‌کند. پس‌زمینه‌اش با اسپلشِ نیتیو یکی است
 * تا انتقال بی‌درز باشد.
 */
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const container = useSharedValue(1);
  const markScale = useSharedValue(0.7);
  const markOpacity = useSharedValue(0);
  const glow = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(14);

  useEffect(() => {
    // ورود
    markOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    markScale.value = withSequence(
      withTiming(1.06, { duration: 560, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 240, easing: Easing.inOut(Easing.ease) })
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    wordOpacity.value = withDelay(420, withTiming(1, { duration: 460 }));
    wordY.value = withDelay(420, withTiming(0, { duration: 460, easing: Easing.out(Easing.cubic) }));

    // خروج
    container.value = withDelay(
      1650,
      withTiming(0, { duration: 420, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
  }, [container, glow, markOpacity, markScale, wordOpacity, wordY]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.45,
    transform: [{ scale: 0.92 + glow.value * 0.16 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));

  return (
    <Animated.View style={[styles.fill, containerStyle]} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.glowWrap, glowStyle]}>
          <Image source={require('../../../assets/images/logo-glow.png')} style={styles.glow} contentFit="contain" />
        </Animated.View>
        <Animated.View style={markStyle}>
          <Image source={require('../../../assets/logo/logo-mark-gold.png')} style={styles.mark} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.word, wordStyle]}>
          <Image source={require('../../../assets/logo/wordmark-on-dark.png')} style={styles.wordImg} contentFit="contain" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 999,
    elevation: 999,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { width: 320, height: 320 },
  mark: { width: 116, height: 116 },
  word: { position: 'absolute', bottom: '34%' },
  wordImg: { width: 168, height: 50 },
});
