import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts, fontSizes } from '@/core/theme';
import { AppText } from '@/presentation/components/AppText';
import { Icon } from '@/presentation/components/Icon';

/**
 * راهنمای «اگر نصب انجام نشد، اول حذف کن».
 *
 * چرا لازم است: نسخه‌هایی از نودوست که خارج از بازار (نصبِ مستقیم) پخش شده بودند
 * با کلیدِ امضای دیگری ساخته شده‌اند. اندروید اجازه نمی‌دهد برنامه‌ای با امضای
 * متفاوت روی نسخه‌ی نصب‌شده بنشیند و نصب را با خطای
 * `INSTALL_FAILED_UPDATE_INCOMPATIBLE` رد می‌کند. تنها راهِ کاربر این است که
 * نسخه‌ی قدیمی را حذف و نسخه‌ی جدید را تازه نصب کند.
 *
 * دو حالتِ نمایشی (`variant`):
 *  - `alert`   → کارتِ رزِ برجسته. برای دروازه‌ی به‌روزرسانی که کاربر *حتماً* در
 *                حالِ نصب است و احتمالِ خطا بالاست.
 *  - `subtle`  → آکاردئونِ جمع‌شده و خنثی. برای صفحه‌های «اپ را نصب کن» که مخاطبِ
 *                اصلی‌شان کاربرِ تازه است؛ هشدارِ قرمزِ بزرگ آن‌جا بی‌خود می‌ترساند.
 *
 * `showAccountNote` را در صفحه‌هایی که *خودشان* پیامِ «حسابت همان می‌ماند» دارند
 * خاموش کن تا حرف تکراری نشود.
 */
const STEPS = [
  'نسخه‌ی فعلیِ نودوست را از روی گوشی حذف کن.',
  'دوباره از همین صفحه، نسخه‌ی جدید را نصب کن.',
] as const;

type Props = {
  variant?: 'alert' | 'subtle';
  showAccountNote?: boolean;
};

export function ReinstallNotice({ variant = 'alert', showAccountNote = true }: Props) {
  const subtle = variant === 'subtle';
  const [open, setOpen] = useState(!subtle);

  const details = (
    <>
      <AppText variant="bodySm" style={styles.body}>
        اگر هنگام نصب با خطا روبه‌رو شدی، یعنی نسخه‌ی روی گوشی‌ات با امضای دیگری نصب شده
        است. در این حالت کافی است:
      </AppText>

      <View style={styles.steps}>
        {STEPS.map((text, i) => (
          <View key={text} style={styles.step}>
            <View style={styles.stepNum}>
              <AppText style={styles.stepNumText}>{i + 1}</AppText>
            </View>
            <AppText variant="bodySm" style={styles.stepText}>
              {text}
            </AppText>
          </View>
        ))}
      </View>

      {showAccountNote && (
        <View style={styles.reassure}>
          <Icon name="shield-check" size={18} tint="gold" />
          <AppText variant="caption" style={styles.reassureText}>
            نگران نباش — حسابت روی سرور محفوظ است. بعد از نصب، با همان شماره‌ی موبایل وارد شو
            و همه‌چیز سرِ جایش است.
          </AppText>
        </View>
      )}
    </>
  );

  const header = (
    <View style={styles.header}>
      <View style={[styles.badge, subtle && styles.badgeSubtle]}>
        <AppText style={[styles.badgeGlyph, subtle && styles.badgeGlyphSubtle]}>!</AppText>
      </View>
      <View style={styles.headerText}>
        <AppText variant={subtle ? 'bodySm' : 'heading'} style={subtle ? styles.headerTitle : undefined}>
          {subtle ? 'نصب انجام نشد؟' : 'اگر نصب انجام نشد'}
        </AppText>
        {!subtle && (
          <AppText variant="caption" style={styles.sub}>
            خطای «بسته با نسخه‌ی نصب‌شده سازگار نیست»
          </AppText>
        )}
      </View>
      {/* tint=white: آیکن‌های پوشه‌ی ink تیره‌اند و روی سطحِ تیره دیده نمی‌شوند. */}
      {subtle && (
        <Icon
          name="chevron-next"
          size={16}
          tint="white"
          style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}
        />
      )}
    </View>
  );

  if (!subtle) {
    return (
      <View style={styles.card}>
        {header}
        {details}
      </View>
    );
  }

  return (
    <View style={styles.cardSubtle}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="راهنمای رفعِ مشکلِ نصب"
        hitSlop={8}
      >
        {header}
      </Pressable>
      {open && <View style={styles.subtleBody}>{details}</View>}
    </View>
  );
}

const BADGE = 30;
const STEP_NUM = 24;

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.roseSoft,
    backgroundColor: colors.roseFaint,
  },
  cardSubtle: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  subtleBody: { gap: spacing.md, marginTop: spacing.md },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rose,
  },
  badgeSubtle: {
    width: 22,
    height: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.roseSoft,
  },
  badgeGlyph: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: BADGE,
    color: colors.onPhoto,
  },
  badgeGlyphSubtle: {
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.rose,
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.bold },
  // روی پس‌زمینه‌ی رزِ کارت، ink3 خیلی کم‌کنتراست بود؛ ink2 خواناتر است.
  sub: { color: colors.ink2 },
  body: { color: colors.ink2 },
  steps: { gap: spacing.sm },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNum: {
    width: STEP_NUM,
    height: STEP_NUM,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.roseSoft,
    backgroundColor: 'transparent',
  },
  stepNumText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: STEP_NUM,
    color: colors.rose,
  },
  stepText: { flex: 1, color: colors.ink },
  reassure: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  reassureText: { flex: 1, color: colors.ink2 },
});
