import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from './Button';
import { Icon } from './Icon';
import { TierBadge, tierName } from './TierBadge';
import { useSession } from '@/presentation/providers/SessionProvider';
import { faNum } from '@/core/utils/faNum';
import { faJalali, daysUntil } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/**
 * پنجره‌ی تبریکِ فعال‌سازیِ اشتراک — به‌محضِ بالا رفتنِ سطحِ کاربر (خرید/فعال‌سازی)
 * یک‌بار نشان داده می‌شود. وضعیت از SessionProvider می‌آید، پس هر مسیرِ خرید
 * (کافه‌بازار، زرین‌پال، اعطای ادمین) خودکار همین را تریگر می‌کند.
 */
export function CelebrationModal() {
  const { celebrateTier, dismissCelebration, user } = useSession();
  const visible = celebrateTier != null;
  const name = celebrateTier ? tierName(celebrateTier) : '';
  const expiry = faJalali(user?.subscriptionUntil);
  const remaining = daysUntil(user?.subscriptionUntil);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="diamond-fill" size={30} tint="gold" />
          </View>
          {celebrateTier ? (
            <View style={styles.badgeRow}>
              <TierBadge tier={celebrateTier} height={28} />
            </View>
          ) : null}
          <Text style={styles.title}>🎉 تبریک!</Text>
          <Text style={styles.hint}>
            {`اشتراکِ ${name} با موفقیت فعال شد. از همین حالا همه‌ی امکاناتش برایت باز است.`}
          </Text>

          {expiry ? (
            <View style={styles.metaRow}>
              <Icon name="check" size={14} tint="gold" />
              <Text style={styles.metaText}>
                {`فعال تا ${expiry}${remaining > 0 ? ` · ${faNum(remaining)} روزِ باقی‌مانده` : ''}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button label="بزن بریم" icon="check" onPress={dismissCelebration} style={styles.btnFull} />
            <Button
              label="دیدنِ امکانات"
              variant="ghost"
              onPress={() => {
                dismissCelebration();
                router.push('/plans');
              }}
              style={styles.btnFull}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.72)' },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    marginBottom: spacing.md,
  },
  badgeRow: { alignItems: 'center', marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.gold2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.gold2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actions: { marginTop: spacing.lg, gap: spacing.sm, alignSelf: 'stretch' },
  btnFull: { width: '100%' },
});
