/*
 * قاعده‌ی `immutability` کامپایلرِ React مدلی از «مقدارِ مشترکِ Reanimated»
 * ندارد: هر مقداری که داخلِ `useEffect` لمس شود را متعلق به افکت می‌داند و
 * تغییرِ بعدی‌اش را خطا می‌گیرد. ولی `SharedValue` اساساً بیرونِ چرخه‌ی رندرِ
 * React زندگی می‌کند و دقیقاً برای همین ساخته شده که در ژست‌ها و کال‌بک‌ها
 * تغییر کند — مستندِ خودِ Reanimated هم همین را می‌گوید.
 *
 * جای دیگری از اپ این تناقض پیش نمی‌آید (هیچ افکتی مقدارِ مشترک را دست
 * نمی‌زند)، پس خاموشی فقط در همین فایل است و نه در پیکربندیِ سراسری.
 */
/* eslint-disable react-hooks/immutability */
import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelect } from '@/core/haptics';
import { colors, durations, gradients, radius, shadow, spacing, springs } from '@/core/theme';

/** فاصله‌ی سُرخوردنِ برگه از پایینِ صفحه؛ از بلندترین حالتِ برگه بیشتر است. */
const TRAVEL = 620;
/** چقدر باید پایین کشیده شود تا رهاکردن یعنی «ببند». */
const DISMISS_RATIO = 0.28;
/** سرعتی که حتی زیرِ آن نسبت هم برگه را می‌بندد. */
const DISMISS_VELOCITY = 700;

interface Props {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  /** استایلِ اضافی روی خودِ پنلِ برگه. */
  style?: ViewStyle;
  /** پنهان‌کردنِ دستگیره — برای برگه‌ای که عمداً کشیدنی نیست. */
  grabber?: boolean;
}

/**
 * برگه‌ی پایینی — قابِ مشترکِ همه‌ی برگه‌های اپ.
 *
 * پیش از این هر برگه (کنش، ارتقا، رتبه، منبعِ عکس) خودش Modal و پس‌زمینه و
 * فنرِ ورود را از نو می‌نوشت، و هیچ‌کدام **کشیدنی** نبودند — با اینکه دستگیره
 * داشتند و مستندِ UpgradeSheet هم صراحتاً وعده‌ی «با کشیدن بسته می‌شود» داده
 * بود. دستگیره‌ای که کشیده نمی‌شود بدترین حالت است: چیزی را نوید می‌دهد که
 * نیست، و کاربر یک‌بار امتحان می‌کند و یاد می‌گیرد به رابط اعتماد نکند.
 *
 * جزئیاتِ فیزیک:
 *  • کشیدن به بالا کِش می‌آید (تقسیم بر ۳) نه اینکه قفل شود — جسم باید به هر
 *    فشاری جواب بدهد، حتی جوابِ «نه».
 *  • بسته‌شدن هم با مسافت تصمیم گرفته می‌شود هم با سرعت؛ یک تلنگرِ کوتاه هم
 *    باید ببندد.
 *  • پس‌زمینه هم‌زمان با کشیدن روشن می‌شود، پس کاربر پیش از رهاکردن می‌بیند
 *    که دارد چه می‌کند.
 */
export function BottomSheet({ visible, onDismiss, children, style, grabber = true }: Props) {
  const insets = useSafeAreaInsets();
  /** ۰ = بیرونِ صفحه، ۱ = نشسته. */
  const progress = useSharedValue(0);
  /** جابه‌جاییِ انگشت روی برگه. */
  const drag = useSharedValue(0);
  /** ارتفاعِ واقعیِ برگه — آستانه‌ی بستن نسبتی از آن است. */
  const height = useSharedValue(TRAVEL);

  useEffect(() => {
    if (visible) {
      drag.value = 0;
      progress.value = withSpring(1, springs.gentle);
    } else {
      progress.value = 0;
      drag.value = 0;
    }
  }, [visible, progress, drag]);

  const close = () => {
    // انیمیشنِ خروج را خودمان می‌بریم تا برگه «بیفتد» نه اینکه محو شود.
    drag.value = withTiming(height.value, { duration: durations.quick }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          // بالا کِش می‌آید، پایین آزاد است.
          drag.value = e.translationY < 0 ? e.translationY / 3 : e.translationY;
        })
        .onEnd((e) => {
          const far = drag.value > height.value * DISMISS_RATIO;
          const fast = e.velocityY > DISMISS_VELOCITY;
          if (far || fast) {
            runOnJS(hapticSelect)();
            drag.value = withTiming(height.value, { duration: durations.quick }, (done) => {
              if (done) runOnJS(onDismiss)();
            });
            return;
          }
          drag.value = withSpring(0, springs.gentle);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDismiss]
  );

  const backdropStyle = useAnimatedStyle(() => {
    const pulled = Math.max(0, Math.min(1, drag.value / height.value));
    return { opacity: progress.value * (1 - pulled) };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * TRAVEL + drag.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* ژست‌های داخلِ Modal ریشه‌ی خودشان را لازم دارند — ریشه‌ی اپ به درختِ
          جداگانه‌ی Modal نمی‌رسد. */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={(e) => {
              height.value = e.nativeEvent.layout.height;
            }}
            style={[
              styles.sheet,
              shadow.card,
              { paddingBottom: insets.bottom + spacing.lg },
              style,
              sheetStyle,
            ]}
            accessibilityViewIsModal
          >
            {/* همان گرادیانِ سطح که کارت‌ها دارند — برگه هم جسم است. */}
            <LinearGradient
              colors={gradients.surfaceRaised}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {grabber ? <View style={styles.grabber} /> : null}
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(7,5,11,0.72)' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.rim,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.lg,
  },
});
