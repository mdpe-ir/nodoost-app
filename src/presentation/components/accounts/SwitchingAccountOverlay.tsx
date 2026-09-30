import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSession } from '@/presentation/providers/SessionProvider';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

/**
 * پوششِ «در حالِ جابه‌جاییِ حساب».
 *
 * سوییچِ اکانت کلِ زیردرختِ داده را از نو می‌سازد (کلیدِ React عوض می‌شود) و
 * همین بازسازی یک لحظه طول می‌کشد. بدونِ این پوشش، کاربر در آن فاصله یا
 * داده‌ی اکانتِ قبلی را می‌بیند یا صحنه‌ی خالی.
 *
 * عمداً بیرونِ محدوده‌ی اکانت رندر می‌شود تا خودش با سوییچ بازسازی نشود
 * (وگرنه انیمیشنش از صفر شروع می‌شد و سوسو می‌زد).
 */
export function SwitchingAccountOverlay() {
  const { switching } = useSession();
  if (!switching) return null;
  return (
    <View style={styles.fill} pointerEvents="auto" accessibilityViewIsModal>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.label}>در حالِ جابه‌جاییِ حساب…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    zIndex: 998,
    elevation: 998,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
  },
});
