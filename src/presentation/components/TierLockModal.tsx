import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from './Button';
import { Icon } from './Icon';
import { TierBadge, tierName } from './TierBadge';
import { usePlansViewModel } from '../hooks/usePlansViewModel';
import { tierPerks } from '../tiers/tierFeatures';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '../../core/theme';

/**
 * پنجره‌ی قفلِ سطح — دروازه‌ی زمینه‌ایِ همه‌ی امکاناتِ قفل: دقیقاً می‌گوید کدام
 * امکان به کدام سطح نیاز دارد و آن سطح چه چیزی باز می‌کند. خودِ خرید این‌جا
 * انجام نمی‌شود؛ دکمه‌ی اصلی به ‎/plans?required&feature‎ می‌برد تا کاربر پیش از
 * پرداخت، پلن‌ها را کنارِ هم ببیند (تنها سطحِ خرید در اپ همان صفحه است).
 * با `title`/`message`/`feature` زمینه عوض می‌شود (فیلتر، پسندها، …)؛ پیش‌فرض
 * «شروعِ گفتگو با کاربرِ بالاتر» است.
 */
export function TierLockModal({
  visible,
  requiredTier,
  onClose,
  title,
  message,
  feature,
}: {
  visible: boolean;
  requiredTier: number;
  onClose: () => void;
  title?: string;
  message?: string;
  /** نامِ کوتاهِ امکانِ قفل‌شده — در بنرِ صفحه‌ی سطح‌ها نشان داده می‌شود. */
  feature?: string;
}) {
  const vm = usePlansViewModel();
  const target = vm.tiers.find((t) => t.level === requiredTier);
  const perks = target ? tierPerks(target).slice(0, 4) : [];
  const heading = title ?? 'گفتگو با این کاربر قفل است';
  const body =
    message ??
    `این کاربر سطحِ ${tierName(requiredTier)} دارد. برای شروعِ گفتگو باید حسابت را به سطحِ ${tierName(requiredTier)} یا بالاتر ارتقا بدهی. اگر او پیام بدهد، پاسخ‌دادن برایت آزاد است.`;

  const goToPlans = () => {
    onClose();
    router.push({
      pathname: '/plans',
      params: {
        required: String(requiredTier),
        feature: feature ?? (title ? undefined : 'شروعِ گفتگو با این کاربر'),
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <TierBadge tier={requiredTier} height={28} />
          </View>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.hint}>{body}</Text>

          {perks.length ? (
            <View style={styles.perks}>
              <Text style={styles.perksTitle}>{`با ارتقا به ${tierName(requiredTier)} باز می‌شود:`}</Text>
              {perks.map((p, i) => (
                <View key={i} style={styles.perkRow}>
                  <Icon name="check" size={14} tint="gold" />
                  <Text style={styles.perkText}>{p}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              label={target ? `ارتقا به ${target.name}` : 'مشاهده‌ی سطح‌ها'}
              icon="diamond-fill"
              onPress={goToPlans}
              style={styles.btnFull}
            />
            <Button label="بعداً" variant="outline" onPress={onClose} style={styles.btnFull} />
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
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  badgeRow: { alignItems: 'center', marginBottom: spacing.md },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
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
  perks: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  perksTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  perkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  perkText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  btnFull: { width: '100%' },
});
