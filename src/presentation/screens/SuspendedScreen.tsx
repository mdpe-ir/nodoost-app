import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

export function SuspendedScreen() {
  const { user, logout } = useSession();
  const banned = user?.status === 'banned';

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.icon}>{banned ? '⛔' : '⏳'}</Text>
        <Text style={styles.title}>{banned ? 'حسابِ تو مسدود شده' : 'در حالِ بازبینی'}</Text>
        <Text style={styles.body}>
          {banned
            ? user?.banReason || 'به‌دلیلِ نقضِ قوانینِ نودوست دسترسیِ این حساب محدود شده است.'
            : 'پروفایلِ تو در صفِ بررسیِ تیمِ ماست. به‌زودی نتیجه را اطلاع می‌دهیم.'}
        </Text>
        <Button label="خروج از حساب" onPress={logout} variant="outline" style={styles.btn} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  icon: { fontSize: 56 },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.ink, textAlign: 'center' },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  btn: { marginTop: spacing.xl, minWidth: 200 },
});
