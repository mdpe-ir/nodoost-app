import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

export function SuspendedScreen() {
  const { user, logout } = useSession();
  const banned = user?.status === 'banned';

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.center}>
        <View style={styles.badge}>
          <Icon name={banned ? 'shield' : 'clock'} size={34} tint="gold" />
        </View>
        <Text style={styles.title}>{banned ? 'حسابِ تو مسدود شده' : 'در حالِ بازبینی'}</Text>
        <Text style={styles.body}>
          {banned
            ? user?.banReason || 'به‌دلیلِ نقضِ قوانینِ نودوست دسترسیِ این حساب محدود شده است.'
            : 'پروفایلِ تو در صفِ بررسیِ تیمِ ماست. به‌زودی نتیجه را اطلاع می‌دهیم.'}
        </Text>
        {!banned ? (
          <Text style={styles.hint}>معمولاً کمتر از یک روز طول می‌کشد.</Text>
        ) : null}
        {/*
         * راهِ اعتراض. تنها مسیری است که از این صفحه بیرون می‌رود و عمداً هم
         * AuthGate و هم دروازه‌ی «پروفایلِ کامل»ِ سرور برایش استثنا دارند —
         * وگرنه کاربرِ مسدود هیچ راهی برای رساندنِ حرفش نداشت.
         */}
        <Button
          label={banned ? 'اعتراض به مسدودی' : 'تماس با پشتیبانی'}
          icon="shield-check"
          onPress={() => router.push('/support' as Href)}
          style={styles.btn}
        />
        <Button label="خروج از حساب" onPress={logout} variant="outline" style={styles.btnTight} />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: lineHeights.md,
    paddingHorizontal: spacing.lg,
    maxWidth: 320,
  },
  hint: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, textAlign: 'center' },
  btn: { marginTop: spacing.xl, minWidth: 220 },
  btnTight: { marginTop: spacing.sm, minWidth: 220 },
});
