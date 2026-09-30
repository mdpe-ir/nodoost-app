import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from '@/presentation/components/PressableScale';
import { Icon } from '@/presentation/components/Icon';
import { haptics } from '@/core/haptics';
import { colors, fonts, spacing } from '@/core/theme';

const ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/**
 * کیپدِ عددیِ قفل — همان شکلِ تلگرام: شبکه‌ی ۳×۳، صفر وسطِ ردیفِ آخر و
 * پاککنِ سمتِ دیگر. عدد‌ها در چیدمانِ استانداردِ کیپد می‌مانند (چپ‌به‌راست)
 * چون انگشت‌ها جایشان را از هر کیپدی در جهان می‌شناسند؛ جهتِ RTL فقط روی
 * متن‌ها اعمال می‌شود.
 *
 * این کامپوننت فقط «کیبورد» است: حالتِ ارقامِ واردشده (نقطه‌ها، لرزش) با
 * `PinDots` جدا شده تا صفحه‌ی تنظیم و صفحه‌ی قفل هر دو آزادانه ترکیبش کنند.
 */
export function PinPad({
  onDigit,
  onBackspace,
  backspaceEnabled = false,
  disabled = false,
  /** صفحههای تنظیم: دکمهی تأیید برای انتخابِ طولِ دلخواه (۴ تا ۶). */
  onSubmit,
  submitEnabled = false,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  backspaceEnabled?: boolean;
  disabled?: boolean;
  onSubmit?: () => void;
  submitEnabled?: boolean;
}) {
  const press = (digit: string) => {
    if (disabled) return;
    haptics.select();
    onDigit(digit);
  };

  const back = () => {
    if (disabled || !backspaceEnabled) return;
    haptics.select();
    onBackspace();
  };

  const submit = () => {
    if (disabled || !submitEnabled || !onSubmit) return;
    haptics.commit();
    onSubmit();
  };

  return (
    <View style={styles.grid} accessibilityRole="keyboardkey">
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((digit) => (
            <PressableScale
              key={digit}
              scaleTo={0.92}
              onPress={() => press(digit)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={`رقم ${digit}`}
              disabled={disabled}
            >
              <Text style={styles.digit}>{digit}</Text>
            </PressableScale>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        {onSubmit ? (
          <PressableScale
            scaleTo={0.92}
            onPress={submit}
            style={styles.cell}
            accessibilityRole="button"
            accessibilityLabel="تأیید"
            disabled={disabled || !submitEnabled}
          >
            <Icon name="check" size={26} tint={submitEnabled ? 'gold' : 'muted'} />
          </PressableScale>
        ) : (
          <View style={styles.cell} />
        )}
        <PressableScale
          scaleTo={0.92}
          onPress={() => press('0')}
          style={styles.cell}
          accessibilityRole="button"
          accessibilityLabel="رقم صفر"
          disabled={disabled}
        >
          <Text style={styles.digit}>0</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.92}
          onPress={back}
          style={styles.cell}
          accessibilityRole="button"
          accessibilityLabel="پاک کردن"
          disabled={disabled || !backspaceEnabled}
        >
          <Icon name="backspace" size={24} tint={backspaceEnabled ? 'gold' : 'muted'} />
        </PressableScale>
      </View>
    </View>
  );
}

/** دامنه‌ی لرزشِ «رمز درست نیست» — مثلِ تلگرام کوتاه و خشک. */
const SHAKE = [-10, 10, -6, 6, 0];

export function PinDots({
  length,
  capacity,
  errorKey = 0,
}: {
  length: number;
  capacity: number;
  errorKey?: number;
}) {
  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (errorKey === 0) return;
    offsetX.value = 0;
    offsetX.value = withSequence(
      ...SHAKE.map((to) => withTiming(to, { duration: 55 }))
    );
  }, [errorKey, offsetX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  return (
    <Animated.View
      style={[styles.dotsRow, animatedStyle]}
      accessibilityLabel={`${length} رقم از ${capacity}`}
    >
      {Array.from({ length: capacity }, (_, i) => (
        <View key={i} style={[styles.dot, i < length && styles.dotFilled]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: 'center',
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.lg },
  cell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: fonts.regular,
    fontSize: 30,
    color: colors.ink,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.ink3,
  },
  dotFilled: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
});
