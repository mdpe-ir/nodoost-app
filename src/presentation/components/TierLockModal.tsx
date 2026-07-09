import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from './Button';
import { TierBadge, tierName } from './TierBadge';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '../../core/theme';

/**
 * پنجره‌ی قفلِ سطح — وقتی طرفِ مقابل سطحِ بالاتری دارد و شروعِ گفتگو بسته است.
 * کاربر می‌فهمد چرا پیام قفل است و کدام سطح بازش می‌کند (محرکِ اصلیِ خرید اشتراک).
 */
export function TierLockModal({
  visible,
  requiredTier,
  onClose,
}: {
  visible: boolean;
  requiredTier: number;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <TierBadge tier={requiredTier} height={28} />
          </View>
          <Text style={styles.title}>گفتگو با این کاربر قفل است</Text>
          <Text style={styles.hint}>
            {`این کاربر سطحِ ${tierName(requiredTier)} دارد. برای شروعِ گفتگو باید حسابت را به سطحِ ${tierName(requiredTier)} یا بالاتر ارتقا بدهی. اگر او پیام بدهد، پاسخ‌دادن برایت آزاد است.`}
          </Text>
          <View style={styles.actions}>
            <Button
              label="مشاهده‌ی سطح‌های اشتراک"
              onPress={() => {
                onClose();
                router.push('/profile?tab=plans');
              }}
              style={styles.btn}
            />
            <Button label="بعداً" variant="outline" onPress={onClose} style={styles.btn} />
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
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1 },
});
