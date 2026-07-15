import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { Icon } from '@/presentation/components/Icon';
import { InstallMethods } from '@/presentation/components/InstallMethods';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { usableMethods } from '@/core/config/installConfig';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

const APP_ICON = require('../../../assets/logo/app-icon-1024.png');

/**
 * صفحه‌ی «برای ادامه، اپ را نصب کن». دو حالت دارد (پارامترِ `reason`):
 *  - `purchase` → کاربر روی خرید زده و در وب پرداخت ممکن نیست ⇒ راهنمای نصب برای خرید.
 *  - سایر       → معرفیِ عمومیِ اپِ نیتیو (نسخه‌ی کامل‌تر).
 * روش‌های نصب از `/api/config` می‌آید و از پنلِ ادمین کنترل می‌شود.
 */
export function GetAppScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isPurchase = reason === 'purchase';
  const { install } = useRemoteConfig();
  const methods = usableMethods(install);

  const title = isPurchase ? 'برای خرید، اپ را نصب کن' : 'اپِ اندروید را نصب کن';
  const subtitle = isPurchase
    ? 'پرداختِ اشتراک فقط داخلِ اپ ممکن است'
    : 'تجربه‌ی کامل‌ترِ نودوست روی اپِ نیتیو';

  const benefits = isPurchase
    ? [
        'خریدِ امنِ اشتراک از طریقِ درگاهِ رسمیِ اپ',
        'پس از نصب، از همین شماره وارد شو و اشتراکت را بگیر',
        'دسترسیِ کامل به همه‌ی امکاناتِ نسخه‌ی اندروید',
      ]
    : [
        'سریع‌تر، تمام‌صفحه و بدونِ نوارِ مرورگر',
        'اعلان‌های لحظه‌ای برای پیام‌ها و لایک‌ها',
        'خرید و مدیریتِ اشتراک مستقیم داخلِ اپ',
      ];

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <ScreenHeader
            title={title}
            subtitle={subtitle}
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/discover'))}
          />

          <View style={styles.hero}>
            <Image source={APP_ICON} style={styles.icon} contentFit="cover" />
            <Text style={styles.lead}>
              {isPurchase
                ? 'نسخه‌ی وب فعلاً امکانِ پرداخت ندارد. برای تهیه‌ی اشتراک، اپِ اندرویدِ نودوست را از یکی از راه‌های زیر نصب کن.'
                : 'برای ادامه، اپِ اندرویدِ نودوست را از یکی از راه‌های زیر نصب کن.'}
            </Text>
          </View>

          <View style={styles.benefits}>
            {benefits.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Icon name="check" size={16} tint="gold" />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>راه‌های نصب</Text>
          <InstallMethods methods={methods} />

          <View style={styles.note}>
            <Icon name="shield-check" size={18} tint="gold" />
            <Text style={styles.noteText}>
              حسابت همان می‌ماند؛ کافی است در اپ با همین شماره‌ی موبایل وارد شوی.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  padded: { paddingHorizontal: 18 },
  hero: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  icon: { width: 84, height: 84, borderRadius: radius.xl, marginBottom: spacing.md },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  benefits: { gap: spacing.sm, marginBottom: spacing.xl },
  benefitRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  benefitText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  note: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: 20,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
