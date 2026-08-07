import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

/** فاصله‌ی سُرخوردنِ برگه از پایینِ صفحه؛ از بلندترین حالتِ برگه بیشتر است. */
const TRAVEL = 520;
const ENTER_SPRING = { damping: 20, stiffness: 190, mass: 0.9 } as const;

export interface SheetAction {
  key: string;
  label: string;
  hint?: string;
  icon?: IconName;
  /** ردیفِ خطرناک (حذف، بلاک) — قرمز. */
  danger?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  /** نقلِ کوتاهِ چیزی که کنش رویش انجام می‌شود — مثلاً متنِ پیام. */
  subtitle?: string;
  actions: SheetAction[];
  onDismiss: () => void;
}

/**
 * برگه‌ی کنش (bottom sheet) — الگوی PhotoSourceSheet، ولی با فهرستِ دلخواه.
 *
 * چیدمان راست‌به‌چپ است و هر ردیف هدفِ لمسِ ۵۶ پیکسلی دارد؛ این برگه در تِرِد
 * روی نگه‌داشتنِ حباب باز می‌شود، جایی که انگشت دقیق نیست.
 */
export function ActionSheet({ visible, title, subtitle, actions, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  // ورود با فنر از پایین؛ خروج را خودِ Modal با محوشدن انجام می‌دهد.
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) progress.value = withSpring(1, ENTER_SPRING);
    else progress.value = 0;
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * TRAVEL }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, shadow.card, { paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}
          accessibilityViewIsModal
        >
          <View style={styles.grabber} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.options}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                accessibilityHint={a.hint}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                {a.icon ? (
                  <View style={[styles.glyphBox, a.danger && styles.glyphBoxDanger]}>
                    {/* ستِ آیکن فقط سه ته‌رنگِ gold/white/ink دارد؛ خطر را با
                        رنگِ برچسب و پس‌زمینه‌ی ردیف نشان می‌دهیم، نه با آیکن. */}
                    <Icon name={a.icon} size={18} tint="gold" />
                  </View>
                ) : null}
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, a.danger && styles.rowLabelDanger]}>{a.label}</Text>
                  {a.hint ? <Text style={styles.rowHint}>{a.hint}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
            accessibilityRole="button"
            accessibilityLabel="انصراف"
          >
            <Text style={styles.cancelText}>انصراف</Text>
          </Pressable>
        </Animated.View>
      </View>
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
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.lg,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sub: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  options: { marginTop: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  rowPressed: { opacity: 0.85, borderColor: colors.goldSoft },
  glyphBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
  },
  glyphBoxDanger: { backgroundColor: colors.roseFaint },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowLabelDanger: { color: colors.rose },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  cancel: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelPressed: { opacity: 0.7 },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
});
