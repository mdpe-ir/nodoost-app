import React, { useCallback, useEffect } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, spacing } from '@/core/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.75;
const DOUBLE_TAP_SCALE = 2.5;
const SNAP = { damping: 22, stiffness: 220, mass: 0.8 } as const;

interface Props {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  /** نوارِ پایینِ اختیاری (مثلاً «عکسِ اصلی شود»). */
  footer?: React.ReactNode;
}

/**
 * لایت‌باکسِ تمام‌صفحه‌ی عکس — pinch، pan، دابل‌تپ و دکمه‌های بزرگ/کوچک‌نمایی.
 *
 * برای ریستِ تمیزِ مقیاس/جابه‌جایی هنگامِ عوض‌شدنِ عکس، فراخوان
 * می‌تواند `key={uri}` بدهد؛ خودِ کامپوننت هم با بازشدن دوباره صفر می‌کند.
 */
export function PhotoViewer({ visible, uri, onClose, footer }: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  const reset = useCallback(() => {
    tx.value = 0;
    ty.value = 0;
    scale.value = 1;
    startScale.value = 1;
    startTx.value = 0;
    startTy.value = 0;
  }, [scale, startScale, startTx, startTy, tx, ty]);

  useEffect(() => {
    if (visible) reset();
  }, [visible, uri, reset]);

  const clampPan = (s: number, x: number, y: number) => {
    'worklet';
    const maxX = Math.max(0, ((winW * s) - winW) / 2);
    const maxY = Math.max(0, ((winH * s) - winH) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE * 0.85, startScale.value * e.scale));
      const k = next / scale.value;
      const fx = e.focalX - winW / 2;
      const fy = e.focalY - winH / 2;
      tx.value = fx - (fx - tx.value) * k;
      ty.value = fy - (fy - ty.value) * k;
      scale.value = next;
    })
    .onEnd(() => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value));
      const clamped = clampPan(s, tx.value, ty.value);
      scale.value = withSpring(s, SNAP);
      tx.value = withSpring(clamped.x, SNAP);
      ty.value = withSpring(clamped.y, SNAP);
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1.01) return;
      tx.value = startTx.value + e.translationX;
      ty.value = startTy.value + e.translationY;
    })
    .onEnd(() => {
      if (scale.value <= 1.01) {
        tx.value = withSpring(0, SNAP);
        ty.value = withSpring(0, SNAP);
        return;
      }
      const clamped = clampPan(scale.value, tx.value, ty.value);
      tx.value = withSpring(clamped.x, SNAP);
      ty.value = withSpring(clamped.y, SNAP);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1.05) {
        scale.value = withSpring(1, SNAP);
        tx.value = withSpring(0, SNAP);
        ty.value = withSpring(0, SNAP);
        return;
      }
      const next = DOUBLE_TAP_SCALE;
      const fx = e.x - winW / 2;
      const fy = e.y - winH / 2;
      const nx = fx - fx * next;
      const ny = fy - fy * next;
      const clamped = clampPan(next, nx, ny);
      scale.value = withSpring(next, SNAP);
      tx.value = withSpring(clamped.x, SNAP);
      ty.value = withSpring(clamped.y, SNAP);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (scale.value <= 1.05) {
        runOnJS(onClose)();
      }
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap)
  );

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta));
    const clamped = {
      x: next <= 1 ? 0 : tx.value,
      y: next <= 1 ? 0 : ty.value,
    };
    if (next > 1) {
      const maxX = Math.max(0, ((winW * next) - winW) / 2);
      const maxY = Math.max(0, ((winH * next) - winH) / 2);
      clamped.x = Math.min(maxX, Math.max(-maxX, tx.value));
      clamped.y = Math.min(maxY, Math.max(-maxY, ty.value));
    }
    scale.value = withSpring(next, SNAP);
    tx.value = withSpring(clamped.x, SNAP);
    ty.value = withSpring(clamped.y, SNAP);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.stage, imageStyle]}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={styles.image}
                  contentFit="contain"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              ) : null}
            </Animated.View>
          </GestureDetector>

          <PressableScale
            style={[styles.close, { top: insets.top + spacing.sm, left: spacing.lg }]}
            onPress={onClose}
            hitSlop={10}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          >
            <Icon name="close" size={20} tint="white" />
          </PressableScale>

          <View style={[styles.zoomDock, { bottom: insets.bottom + (footer ? 72 : spacing.lg) }]}>
            <PressableScale
              style={styles.zoomBtn}
              onPress={() => zoomBy(-ZOOM_STEP)}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel="کوچک‌نمایی"
            >
              <Icon name="minus" size={22} tint="white" />
            </PressableScale>
            <PressableScale
              style={styles.zoomBtn}
              onPress={() => zoomBy(ZOOM_STEP)}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel="بزرگ‌نمایی"
            >
              <Icon name="plus" size={20} tint="white" />
            </PressableScale>
          </View>

          {footer ? (
            <View style={[styles.footer, { bottom: insets.bottom + spacing.md }]}>{footer}</View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  zoomDock: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    zIndex: 2,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
});
