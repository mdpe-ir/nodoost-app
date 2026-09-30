import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { PressableScale } from './PressableScale';
import { Button } from './Button';
import { Icon } from './Icon';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

/** دلایلِ آماده‌ی گزارش. «سایر» جای متنِ آزاد است. */
const REASONS = [
  'هرزنگاری و تبلیغات',
  'آزار و توهین',
  'محتوای نامناسب',
  'جعلِ هویت یا کلاهبرداری',
] as const;

interface Props {
  visible: boolean;
  /** نامِ طرفِ مقابل — در متنِ عنوان می‌نشیند. */
  peerName?: string;
  /** در حالِ ثبت — دکمه‌ی «سایر» لودر می‌شود. */
  busy?: boolean;
  /** ثبت ناموفق بود؛ کاربر باید بتواند دوباره تلاش کند. */
  error?: boolean;
  /** دلیلِ نهایی (از فهرست یا متنِ آزاد) را به سرور می‌فرستد. */
  onSubmit: (reason: string) => void;
  onDismiss: () => void;
}

/**
 * برگه‌ی گزارش — ابتدا دلیلِ آماده، و اگر هیچ‌کدام جواب نبود متنِ آزاد.
 *
 * چرا دو مرحله در یک برگه: گزارش‌کردن لحظه‌ای است که کاربر احتمالاً عصبانی یا
 * آزرده است. باز کردنِ یک مودالِ متنیِ خالی به‌عنوان گامِ اول، از او می‌خواهد
 * برای ما بنویسد؛ حالا فقط یک ضربه لازم است و متن آزاد پناهگاهِ آخر است.
 */
export function ReportReasonSheet({ visible, peerName, busy, error, onSubmit, onDismiss }: Props) {
  const [other, setOther] = useState(false);
  const [text, setText] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);

  /*
   * با هر بار باز شدن از صفر شروع می‌کنیم — وگرنه متنِ گزارشِ قبلی سرِ جایش
   * می‌ماند.
   *
   * این «تنظیمِ حالت هنگامِ تغییرِ پراپ» است (الگوی رسمیِ ری‌اکت) و نه افکت:
   * افکت اینجا یک رندرِ آبشاریِ اضافه می‌سازد و قاعده‌ی `set-state-in-effect`
   * هم درست همین را ایراد می‌گیرد.
   */
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setOther(false);
      setText('');
    }
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={styles.title}>
        {other ? 'دلیلِ گزارش' : `گزارشِ ${peerName ?? 'این کاربر'}`}
      </Text>
      <Text style={styles.sub}>
        {other
          ? 'کوتاه توضیح بده چه اتفاقی افتاده. کارشناسِ ما بررسی می‌کند.'
          : 'نزدیک‌ترین دلیل را انتخاب کن. گزارشِ تو با نام نمایش داده نمی‌شود.'}
      </Text>

      {other ? (
        <>
          <TextInput
            autoFocus
            multiline
            maxLength={500}
            value={text}
            onChangeText={setText}
            placeholder="توضیحِ کوتاه…"
            placeholderTextColor={colors.ink3}
            style={styles.input}
            textAlign="right"
          />
          {error ? <Text style={styles.error}>ثبت گزارش ناموفق بود؛ دوباره تلاش کن.</Text> : null}
          <View style={styles.actions}>
            <Button
              label="ثبت گزارش"
              loading={busy}
              disabled={!text.trim()}
              onPress={() => onSubmit(text.trim())}
              style={styles.actionBtn}
            />
            <Button
              label="برگشت"
              variant="outline"
              onPress={() => setOther(false)}
              style={styles.actionBtn}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.options}>
            {REASONS.map((r) => (
              <PressableScale
                key={r}
                onPress={() => onSubmit(r)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={r}
                scaleTo={0.98}
                style={styles.row}
              >
                <View style={styles.glyphBox}>
                  <Icon name="shield" size={18} tint="gold" />
                </View>
                <Text style={styles.rowLabel}>{r}</Text>
              </PressableScale>
            ))}
            <PressableScale
              onPress={() => setOther(true)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="دلیلِ دیگر"
              scaleTo={0.98}
              style={styles.row}
            >
              <View style={styles.glyphBox}>
                <Icon name="edit" size={18} tint="gold" />
              </View>
              <Text style={styles.rowLabel}>دلیلِ دیگر…</Text>
            </PressableScale>
          </View>
          {error ? <Text style={styles.error}>ثبت گزارش ناموفق بود؛ دوباره تلاش کن.</Text> : null}
        </>
      )}
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
    backgroundColor: colors.roseFaint,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    minHeight: 110,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontFamily: fonts.regular,
    color: colors.ink,
    backgroundColor: colors.surface2,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'right',
  },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
});
