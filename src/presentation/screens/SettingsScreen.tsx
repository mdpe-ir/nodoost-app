import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PressableScale } from '@/presentation/components/PressableScale';
import { router, type Href } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Button } from '@/presentation/components/Button';
import { AppVersionInfo } from '@/presentation/components/AppVersionInfo';
import { SettingsGroup, SettingsLink, SettingsToggle } from '@/presentation/components/SettingsRow';
import { useReviewPrompt } from '@/presentation/providers/ReviewPromptProvider';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { tierName } from '@/presentation/components/TierBadge';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** شهرهای حالتِ سفر (الماس) — مختصاتِ مرکزِ شهر. */
const TRAVEL_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'تهران', lat: 35.6892, lng: 51.389 },
  { name: 'مشهد', lat: 36.2605, lng: 59.6168 },
  { name: 'اصفهان', lat: 32.6539, lng: 51.666 },
  { name: 'شیراز', lat: 29.5918, lng: 52.5837 },
  { name: 'تبریز', lat: 38.0962, lng: 46.2738 },
  { name: 'کرج', lat: 35.8327, lng: 50.9916 },
];

/** همه‌ی مسیرهای ارتقا به یک مقصد می‌روند: صفحه‌ی سطح‌ها، با زمینه‌ی امکانِ قفل. */
const goToPlans = (required: number, feature: string) =>
  router.push({ pathname: '/plans', params: { required: String(required), feature } });

/**
 * شماره‌ها با ‎+98‎ ذخیره می‌شوند، ولی در چیدمانِ راست‌به‌چپ علامتِ ‎+‎ به انتهای
 * رشته می‌پرد و «۹۸۹۱۲…+» خوانده می‌شود. شکلِ محلیِ ‎09…‎ هم درست دیده می‌شود و
 * هم همان چیزی است که کاربر خودش وارد کرده بود.
 */
const localPhone = (phone: string): string => faNum(phone.replace(/^\+98/, '0'));

/**
 * تنظیمات — همه‌ی چیزهایی که کاربر «یک‌بار تنظیم می‌کند و می‌رود».
 *
 * پیش‌تر زبانه‌ی سومِ صفحه‌ی «من» بود: بدونِ هیچ نشانه‌ای که چنین جایی هست،
 * پشتِ یک نوارِ زبانه‌ی چسبان. حتی یک نوارِ شناورِ «پشتیبانی» هم اضافه شده بود
 * تا کاربر تهِ همین زبانه را پیدا کند — نشانه‌ی روشنی از این‌که خودِ ساختار
 * اشتباه بود. حالا مقصدِ مستقل است و از هدرِ «من» و کاشیِ دسترسیِ سریع باز
 * می‌شود.
 */
export function SettingsScreen() {
  // این صفحه به عکس و شمارنده‌ها کاری ندارد.
  const vm = useProfileViewModel({ skipMedia: true });
  const reviewPrompt = useReviewPrompt();

  const user = vm.user;
  const userTier = user?.tier ?? 1;

  return (
    <ScreenContainer>
      <StackHeader title="تنظیمات" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="حساب کاربری">
          <SettingsLink
            icon="phone"
            title="شماره‌ی موبایل"
            hint="شماره‌ی ورودِ حساب؛ برای دیگران دیده نمی‌شود"
            value={user?.phone ? localPhone(user.phone) : undefined}
          />
          <SettingsLink
            icon="edit"
            title="ویرایشِ پروفایل"
            hint="نام، معرفی و علاقه‌مندی‌ها"
            onPress={() => router.push('/edit-profile' as Href)}
          />
          <SettingsLink
            icon="diamond-fill"
            title="اشتراک و سطح"
            hint={user?.isPlus ? `اشتراکِ ${tierName(userTier)} فعال است` : 'سطحِ رایگان — امکاناتِ بیشتر را ببین'}
            onPress={() => router.push('/plans')}
          />
        </SettingsGroup>

        {/* پسندها هم این‌جاست و هم کاشیِ دسترسیِ سریع در صفحه‌ی «من» — عمداً دو
            ورودی، چون هر کاربری از یک راه دنبالش می‌گردد. */}
        <SettingsGroup title="فعالیتِ من">
          <SettingsLink
            icon="tab-likes"
            title="پسندها"
            hint="چه کسانی را پسندیده‌ای و چه کسانی تو را"
            onPress={() => router.push('/likes')}
          />
        </SettingsGroup>

        <SettingsGroup title="اعلان‌ها">
          <SettingsLink
            icon="bell"
            title="تنظیماتِ اعلان"
            hint="انتخاب کن برای کدام اتفاق‌ها خبردار شوی"
            onPress={() => router.push('/notification-settings' as Href)}
          />
        </SettingsGroup>

        {/*
         * فهرستِ مسدودشده‌ها هیچ قفلِ سطحی ندارد: بلاک یک ابزارِ ایمنی است، نه
         * یک قابلیتِ فروختنی.
         */}
        <SettingsGroup title="حریمِ خصوصی">
          <SettingsLink
            icon="shield"
            title="کاربرانِ مسدودشده"
            hint="ببین چه کسانی را مسدود کرده‌ای و رفعِ مسدودی کن"
            onPress={() => router.push('/blocked' as Href)}
          />
          <SettingsToggle
            icon="map"
            title="نمایشِ موقعیتِ دقیق"
            hint="پیش‌فرض فقط یک نقطه‌ی تقریبی است"
            value={user?.prefs?.showExactLocationOnMap ?? false}
            saving={vm.savingPref === 'showExactLocationOnMap'}
            onChange={vm.updateMapPrivacy}
          />
          <SettingsToggle
            icon="moon"
            title="پنهان‌کردنِ وضعیتِ آنلاین"
            hint="کسی نبیند کِی آنلاین بوده‌ای"
            value={user?.prefs?.hideOnline ?? false}
            saving={vm.savingPref === 'hideOnline'}
            onChange={(v) => vm.updatePrefs({ hideOnline: v })}
            userTier={userTier}
            requires={{ level: 4, name: 'طلایی', onUpgrade: () => goToPlans(4, 'پنهان‌کردنِ وضعیتِ آنلاین') }}
          />
          <SettingsToggle
            icon="map"
            title="پنهان‌کردنِ فاصله"
            hint="فاصله‌ات از دیگران نمایش داده نشود"
            value={user?.prefs?.hideDistance ?? false}
            saving={vm.savingPref === 'hideDistance'}
            onChange={(v) => vm.updatePrefs({ hideDistance: v })}
            userTier={userTier}
            requires={{ level: 4, name: 'طلایی', onUpgrade: () => goToPlans(4, 'پنهان‌کردنِ فاصله') }}
          />
          <SettingsToggle
            icon="shield"
            title="حالتِ ناشناس"
            hint="از کاوش، اطراف و نقشه حذف می‌شوی؛ بازدیدت هم ثبت نمی‌شود"
            value={user?.prefs?.incognito ?? false}
            saving={vm.savingPref === 'incognito'}
            onChange={(v) => vm.updatePrefs({ incognito: v })}
            userTier={userTier}
            requires={{ level: 5, name: 'الماس', onUpgrade: () => goToPlans(5, 'حالتِ ناشناس') }}
          />
        </SettingsGroup>

        {/* — حالتِ سفر (الماس): جست‌وجو در شهرِ دلخواه — */}
        <SettingsGroup title="حالتِ سفر">
          {userTier < 5 ? (
            <SettingsLink
              icon="lock"
              title="جست‌وجو در شهرِ دلخواه"
              hint="ویژه‌ی سطحِ الماس — برای فعال‌سازی ارتقا بده"
              tone="gold"
              onPress={() => goToPlans(5, 'حالتِ سفر')}
            />
          ) : user?.prefs?.travelMode ? (
            <View style={styles.travelBox}>
              <Text style={styles.travelTitle}>حالتِ سفر فعال است ✈️</Text>
              <Text style={styles.travelHint}>در شهرِ انتخابی دیده می‌شوی و همان‌جا جست‌وجو می‌کنی.</Text>
              <Button
                label="بازگشت به موقعیتِ واقعی"
                size="sm"
                variant="ghost"
                onPress={vm.stopTravel}
                loading={vm.travelBusy}
              />
            </View>
          ) : (
            <View style={styles.travelBox}>
              <Text style={styles.travelHint}>یک شهر انتخاب کن تا موقعیتت موقتاً آن‌جا باشد:</Text>
              <View style={styles.travelCities}>
                {TRAVEL_CITIES.map((c) => (
                  <PressableScale
                    scaleTo={0.94}
                    feedback="tap"
                    key={c.name}
                    style={styles.cityChip}
                    onPress={() => vm.startTravel(c.lat, c.lng)}
                    disabled={vm.travelBusy}
                    accessibilityRole="button"
                    accessibilityLabel={`سفر به ${c.name}`}
                  >
                    <Text style={styles.cityChipText}>{c.name}</Text>
                  </PressableScale>
                ))}
              </View>
            </View>
          )}
        </SettingsGroup>

        {/*
         * پشتیبانی عمداً این‌جا نیست. جایش هدرِ صفحه‌ی «من» و کاشیِ دسترسیِ سریع
         * است — کسی که مشکل دارد سراغِ «تنظیمات» نمی‌رود.
         * «نظر و امتیاز» فقط در بیلدِ کافه‌بازار معنا دارد (وب فروشگاهی ندارد).
         */}
        {reviewPrompt.available ? (
          <SettingsGroup title="نودوست">
            <SettingsLink
              icon="star"
              title="نظر و امتیاز به نودوست"
              hint="نظرت را در کافه‌بازار ثبت کن"
              tone="gold"
              onPress={reviewPrompt.open}
            />
          </SettingsGroup>
        ) : null}

        {/* AppVersionInfo خودش marginTop دارد؛ قابِ اضافه فاصله را دوبرابر می‌کرد. */}
        <AppVersionInfo />

        <Button label="خروج از حساب" variant="danger" onPress={vm.logout} style={styles.logout} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2 },

  travelBox: { padding: spacing.lg, gap: spacing.md, alignItems: 'stretch' },
  travelTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  travelHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  travelCities: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  cityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  cityChipText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },

  logout: { marginTop: spacing.xl },
});
