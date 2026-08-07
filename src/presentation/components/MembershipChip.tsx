import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { tierColor, tierName } from './TierBadge';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, radius, spacing } from '@/core/theme';

/**
 * چیپِ اشتراک در هدر — ورودیِ همیشه‌دیدنیِ صفحه‌ی سطح‌ها.
 *
 * مسئله‌ای که حل می‌کند: تا پیش از این، تنها راهِ رسیدن به ‎/plans‎ یا رفتن به
 * پروفایل بود یا خوردن به یک قفل. کاربری که می‌خواست *قبل از* گیرکردن اشتراک
 * بخرد یا تمدید کند، هیچ مسیرِ مستقیمی نداشت — پرتکرارترین شکایت.
 *
 * سه حالت، هر سه با یک نگاه قابلِ تشخیص:
 *   رایگان        → «ارتقا» طلایی (دعوت)
 *   مشترک         → نامِ سطح با رنگِ همان سطح
 *   رو به انقضا   → نامِ سطح + روزهای مانده (۷ روز و کمتر)
 */
export function MembershipChip() {
  const { user } = useSession();
  const { quota } = useQuota();
  const isPlus = Boolean(user?.isPlus);
  const level = user?.tier ?? 1;
  const daysLeft = quota?.daysLeft ?? 0;
  // یادآوریِ تمدید فقط وقتی واقعاً نزدیک است؛ زودتر از آن به چشمِ تبلیغ می‌آید.
  const expiring = isPlus && daysLeft > 0 && daysLeft <= 7;

  const go = () => router.push('/plans');

  if (!isPlus) {
    return (
      <Pressable
        onPress={go}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="ارتقای اشتراک"
        style={({ pressed }) => [styles.chip, styles.chipFree, pressed && styles.pressed]}
      >
        <Icon name="diamond-fill" size={13} tint="gold" />
        <Text style={styles.freeText}>ارتقا</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={go}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`اشتراکِ ${tierName(level)}${expiring ? ` — ${daysLeft} روز مانده` : ''}`}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: tierColor(level) },
        expiring && styles.chipExpiring,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.tierText, { color: tierColor(level) }]}>{tierName(level)}</Text>
      {expiring ? <Text style={styles.daysText}>{`${faNum(daysLeft)} روز`}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipFree: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  chipExpiring: { backgroundColor: colors.roseFaint, borderColor: colors.roseSoft },
  pressed: { opacity: 0.75 },
  freeText: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.gold2 },
  tierText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, writingDirection: 'rtl' },
  daysText: { fontFamily: fonts.medium, fontSize: 10, color: colors.rose, writingDirection: 'rtl' },
});
