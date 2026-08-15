import React from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/core/haptics';
import { durations, springs } from '@/core/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Feedback = 'select' | 'tap' | 'commit' | 'none';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  /** مقدارِ کوچک‌شدن هنگامِ فشار. برای اجسامِ بزرگ‌تر عددِ نزدیک‌تر به ۱ بده. */
  scaleTo?: number;
  /** کم‌شدنِ شفافیت هنگامِ فشار — پیش‌فرض خاموش است تا فقط فنر دیده شود. */
  dimTo?: number;
  /**
   * روشن‌شدنِ پس‌زمینه هنگامِ فشار — قراردادِ ردیف‌های فهرست. هر دو رنگ باید
   * داده شود و `backgroundColor` نباید در `style` باشد، وگرنه استایلِ ثابت
   * روی مقدارِ متحرک می‌افتد.
   */
  bg?: string;
  bgPressed?: string;
  /** کدام لرزش هنگامِ فشار. `none` برای کنش‌های پرتکرار در فهرست‌های بلند. */
  feedback?: Feedback;
  style?: StyleProp<ViewStyle>;
}

/**
 * دکمه‌ی فنری — جای `Pressable` با استایلِ `pressed`.
 *
 * تفاوتش با حالتِ قبلی (`pressed && { opacity, transform }`) این است که آن‌جا
 * دو حالتِ گسسته داشتیم: فشرده و رها. جسم بلافاصله می‌پرید به حالتِ دوم.
 * اینجا رهاکردن یک فنر است، پس انگشت که برداشته می‌شود جسم برمی‌گردد بالا —
 * همان چیزی که آدم از یک کلیدِ فیزیکی انتظار دارد. لرزش دقیقاً روی
 * `onPressIn` می‌نشیند، نه `onPress`؛ بازخوردِ لمسی باید هم‌زمان با لمس باشد،
 * نه بعد از انجامِ کار.
 */
export function PressableScale({
  children,
  scaleTo = 0.95,
  dimTo,
  bg,
  bgPressed,
  feedback = 'tap',
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const tinted = bg != null && bgPressed != null;

  // عمداً بدونِ useCallback: مقدارِ مشترکِ Reanimated بیرونِ چرخه‌ی رندرِ React
  // است، و بسته‌بندی‌اش در هوک باعث می‌شود کامپایلرِ React آن را حالتِ رندری
  // بداند و تغییرش را خطا بگیرد. این توابع هم چیزی را re-render نمی‌کنند.
  const handleIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    pressed.value = withTiming(1, { duration: durations.instant });
    if (feedback !== 'none') haptics[feedback]();
    onPressIn?.(e);
  };

  const handleOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    pressed.value = withSpring(0, springs.snappy);
    onPressOut?.(e);
  };

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    ...(dimTo != null ? { opacity: 1 - pressed.value * (1 - dimTo) } : null),
    ...(tinted
      ? { backgroundColor: interpolateColor(pressed.value, [0, 1], [bg as string, bgPressed as string]) }
      : null),
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={disabled ? undefined : handleIn}
      onPressOut={disabled ? undefined : handleOut}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
