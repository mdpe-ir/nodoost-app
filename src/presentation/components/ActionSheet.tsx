import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';
import { BottomSheet } from './BottomSheet';
import { PressableScale } from './PressableScale';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

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
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? (
        <Text style={styles.sub} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}

      <View style={styles.options}>
        {actions.map((a) => (
          <PressableScale
            key={a.key}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            accessibilityHint={a.hint}
            scaleTo={0.98}
            feedback={a.danger ? 'commit' : 'select'}
            style={styles.row}
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
          </PressableScale>
        ))}
      </View>

      <PressableScale
        onPress={onDismiss}
        style={styles.cancel}
        scaleTo={0.97}
        feedback="select"
        accessibilityRole="button"
        accessibilityLabel="انصراف"
      >
        <Text style={styles.cancelText}>انصراف</Text>
      </PressableScale>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({


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
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
  },
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
    borderTopColor: colors.rim,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
});
