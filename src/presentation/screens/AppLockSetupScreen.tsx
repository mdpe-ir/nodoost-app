import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import {
  SettingsGroup,
  SettingsLink,
  SettingsToggle,
} from '@/presentation/components/SettingsRow';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { useAppLock } from '@/presentation/providers/AppLockProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { getBiometricCapability, type BiometricCapability } from '@/core/security/biometrics';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

/** برچسبِ فارسیِ انواعِ بیومتریک — برای ردیفِ تنظیم. */
const bioLabel = (cap: BiometricCapability): string => {
  const names = cap.kinds.map((k) =>
    k === 'fingerprint' ? 'اثرِ انگشت' : k === 'face' ? 'تشخیصِ چهره' : 'عنبیه'
  );
  return names.length > 1 ? names.slice(0, -1).join('، ') + ' یا ' + names.at(-1) : names[0];
};

/**
 * تنظیمِ قفلِ برنامه — انتخابِ شکلِ قفل یا برداشتنش.
 *
 * این صفحه فقط «منوی تصمیم» است: کارِ سخت (هش، ذخیره) در پرووایدر و در
 * صفحههای زیرمجموعهاش است. اگر پیکربندیِ ریموت قابلیت را بسته باشد، منو
 * بیاثر میشود — بدونِ حذفِ مسیرها، چون قفلِ از قبل تنظیمشده باید بماند.
 */
export function AppLockSetupScreen() {
  const { configured, type, disable, biometricEnabled, setBiometricEnabled } = useAppLock();
  const { appLock: cfg } = useRemoteConfig();
  const [bio, setBio] = useState<BiometricCapability | null>(null);

  // سختافزارِ بیومتریک یک‌بار سنجیده میشود؛ نتیجه فقط برای نمایشِ ردیف است.
  useEffect(() => {
    let alive = true;
    void getBiometricCapability().then((cap) => {
      if (alive) setBio(cap);
    });
    return () => {
      alive = false;
    };
  }, []);

  const showBiometricRow = configured && bio?.available === true;

  return (
    <ScreenContainer>
      <StackHeader title="قفلِ برنامه" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          با قفلِ برنامه، هر بار که از اپ بیرون بروی و برگردی، باید رمز بدهی. حتی اگر
          گوشی دستِ کسی باشد، گفتگوهایت پیدایش نمیشود.
        </Text>

        {!cfg.enabled ? (
          <View style={styles.offCard}>
            <Icon name="lock" size={16} tint="muted" />
            <Text style={styles.offText}>
              این قابلیت فعلاً روی حسابِ تو فعال نیست.
            </Text>
          </View>
        ) : null}

        <SettingsGroup title="شکلِ قفل">
          <SettingsLink
            icon="keypad"
            title="رمز عددی"
            hint={
              configured && type === 'pin'
                ? `فعال — ${faNum(cfg.minDigits)} تا ${faNum(cfg.maxDigits)} رقم`
                : `${faNum(cfg.minDigits)} تا ${faNum(cfg.maxDigits)} رقم`
            }
            onPress={() => router.push('/app-lock/pin')}
          />
          {cfg.allowPattern ? (
            <SettingsLink
              icon="menu"
              title="الگو"
              hint={
                configured && type === 'pattern'
                  ? 'فعال — اتصالِ حداقلِ ۴ نقطه'
                  : 'اتصالِ حداقلِ ۴ نقطه'
              }
              onPress={() => router.push('/app-lock/pattern')}
            />
          ) : null}
        </SettingsGroup>

        {showBiometricRow && bio ? (
          <SettingsGroup title="میانبرِ بازکردن" hint="رمزِ اصلی همیشه پشتِ آن می‌ماند">
            <SettingsToggle
              icon="fingerprint"
              title={`بازکردن با ${bioLabel(bio)}`}
              hint="موقعِ ورود، به‌جای تایپِ رمز از بیومتریکِ گوشی استفاده کن"
              value={biometricEnabled}
              onChange={(v) => void setBiometricEnabled(v)}
            />
          </SettingsGroup>
        ) : null}

        {configured && !cfg.force ? (
          <Button
            label="برداشتنِ قفل"
            variant="danger"
            onPress={() =>
              void disable()
            }
            style={styles.disable}
          />
        ) : null}

        {configured && cfg.force ? (
          <Text style={styles.note}>
            این قفل توسطِ نودوست اجباری شده و از داخلِ اپ برداشته نمیشود.
          </Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2 },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  offCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  offText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  disable: { marginTop: spacing.xl },
  note: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
  },
});
