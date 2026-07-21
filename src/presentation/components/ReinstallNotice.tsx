import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts, fontSizes } from '@/core/theme';
import { AppText } from '@/presentation/components/AppText';
import { Icon } from '@/presentation/components/Icon';

/**
 * هشدارِ «اگر نصب انجام نشد، اول حذف کن».
 *
 * چرا لازم است: نسخه‌هایی از نودوست که خارج از بازار (نصبِ مستقیم) پخش شده بودند
 * با کلیدِ امضای دیگری ساخته شده‌اند. اندروید اجازه نمی‌دهد برنامه‌ای با امضای
 * متفاوت روی نسخه‌ی نصب‌شده بنشیند و نصب را با خطای
 * `INSTALL_FAILED_UPDATE_INCOMPATIBLE` رد می‌کند. تنها راهِ کاربر این است که
 * نسخه‌ی قدیمی را حذف و نسخه‌ی جدید را تازه نصب کند.
 *
 * نکته‌ی مهمِ UX: حذفِ برنامه توکنِ لاگین (SecureStore) را پاک می‌کند، ولی حساب
 * روی سرور است؛ پس کاربر با همان شماره‌ی موبایل دوباره وارد می‌شود و چیزی از
 * دست نمی‌رود. این اطمینان‌بخشی عمداً بخشی از کارت است تا کاربر از حذف نترسد.
 */
const STEPS = [
  'نسخه‌ی فعلیِ نودوست را از روی گوشی حذف کن.',
  'دوباره از همین صفحه، نسخه‌ی جدید را نصب کن.',
] as const;

export function ReinstallNotice() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <AppText style={styles.badgeGlyph}>!</AppText>
        </View>
        <View style={styles.headerText}>
          <AppText variant="heading">اگر نصب انجام نشد</AppText>
          <AppText variant="caption" style={styles.sub}>
            خطای «بسته با نسخه‌ی نصب‌شده سازگار نیست»
          </AppText>
        </View>
      </View>

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

      <View style={styles.reassure}>
        <Icon name="shield-check" size={18} tint="gold" />
        <AppText variant="caption" style={styles.reassureText}>
          نگران نباش — حسابت روی سرور محفوظ است. بعد از نصب، با همان شماره‌ی موبایل وارد شو
          و همه‌چیز سرِ جایش است.
        </AppText>
      </View>
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
  badgeGlyph: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: BADGE,
    color: colors.onPhoto,
  },
  headerText: { flex: 1, gap: 2 },
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
