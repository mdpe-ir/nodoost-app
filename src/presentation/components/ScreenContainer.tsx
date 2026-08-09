import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';
import { InstallButton } from '@/presentation/components/InstallButton';
import { NotificationBell } from '@/presentation/components/NotificationBell';
import { SupportButton } from '@/presentation/components/SupportButton';
import { MembershipChip } from '@/presentation/components/MembershipChip';
import { Icon } from '@/presentation/components/Icon';

/** حاشیه‌ی افقیِ استانداردِ صفحات — برای محاسبه‌ی عرضِ سلول‌ها هم استفاده می‌شود. */
export const PAGE_PADDING = 18;

interface Props {
  children: React.ReactNode;
  /** اگر true باشد padding افقیِ پیش‌فرض اعمال نمی‌شود (برای فهرست‌های تمام‌عرض). */
  flush?: boolean;
  style?: ViewStyle;
}

/** قابِ پایه‌ی صفحه: پس‌زمینه‌ی تیره + رعایتِ ناحیه‌ی امن. */
export function ScreenContainer({ children, flush, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + spacing.sm }, !flush && styles.padded, style]}
    >
      {children}
    </View>
  );
}

/**
 * هدرِ یک‌دستِ صفحات — عنوانِ بزرگِ طلایی (راست‌چین) + کنشِ اختیاری در سمتِ چپ.
 * اگر `onBack` بدهی، دکمه‌ی بازگشت در سمتِ راست می‌نشیند (قراردادِ RTL) و ردیف
 * راست‌به‌چپ چیده می‌شود.
 * در حالتِ بدونِ بازگشت (صفحه‌های تب) زنگوله‌ی اعلان‌ها همیشه هست — مثلِ اینستاگرام
 * از هر تب در دسترس است.
 * با `support` یک دکمه‌ی پشتیبانی هم سمتِ راستِ زنگوله می‌نشیند (صفحه‌ی «من»).
 * با `membership` چیپِ وضعیتِ اشتراک هم اضافه می‌شود — ورودیِ همیشه‌دیدنیِ
 * «سطحِ من / ارتقا»، چون رایج‌ترین شکایت این بود که کاربر اصلاً نمی‌دانست
 * اشتراک را از کجا باید تمدید کند.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  onBack,
  support,
  membership,
  settings,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
  /** نمایشِ دکمه‌ی پشتیبانی کنارِ زنگوله — فقط در حالتِ بدونِ بازگشت. */
  support?: boolean;
  /** نمایشِ چیپِ اشتراک — فقط در حالتِ بدونِ بازگشت. */
  membership?: boolean;
  /** نمایشِ دکمه‌ی تنظیمات — جای قراردادیِ آن، هدرِ صفحه‌ی «من» است. */
  settings?: boolean;
}) {
  if (onBack) {
    return (
      <View style={[styles.head, styles.headBack]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          {/* در RTL بازگشت به سمتِ راست است — شورونِ رو به راست */}
          <Icon name="chevron-next" size={22} tint="gold" />
        </Pressable>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <View style={styles.headTrailing}>{action}</View> : null}
      </View>
    );
  }
  return (
    <View style={styles.head}>
      <View style={styles.headActions}>
        {/* چیدمانِ row-reverse: فرزندِ اول راست‌ترین است — پشتیبانی سمتِ راستِ زنگوله. */}
        {membership ? <MembershipChip /> : null}
        {support ? <SupportButton /> : null}
        <NotificationBell />
        {settings ? <SettingsButton /> : null}
        {action ?? <InstallButton />}
      </View>
      <View style={styles.headText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** دکمه‌ی تنظیماتِ هدر — منوی همبرگری، جای قراردادیِ «بقیه‌ی چیزها». */
function SettingsButton() {
  return (
    <Pressable
      onPress={() => router.push('/settings' as Href)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="تنظیمات"
      style={({ pressed }) => [styles.headBtn, pressed && styles.headBtnPressed]}
    >
      <Icon name="menu" size={22} tint="gold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: PAGE_PADDING },
  head: {
    // ریشهٔ وب عمداً LTR است؛ action به‌عنوان فرزند اول در چپ و متن در راست می‌نشیند.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  // زنگوله سمتِ راستِ گروه (نزدیکِ عنوان) و کنش/دکمه‌ی نصب سمتِ چپ.
  headActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  // حالتِ بازگشت‌دار: راست‌به‌چپ تا دکمه‌ی بازگشت در سمتِ راست بنشیند.
  headBack: { flexDirection: 'row-reverse', gap: spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: colors.surface, opacity: 0.9 },
  headBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headBtnPressed: { backgroundColor: colors.surface },
  headTrailing: { alignItems: 'flex-start' },
  headText: { flex: 1, alignItems: 'flex-end' },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 38,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
