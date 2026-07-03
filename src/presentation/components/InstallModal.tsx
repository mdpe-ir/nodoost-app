import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { colors, fonts, fontSizes, radius, spacing, shadow } from '@/core/theme';

const APP_ICON = require('../../../assets/logo/app-icon-1024.png');

interface Props {
  visible: boolean;
  isIOS: boolean;
  /** روی اندروید/دسکتاپ رویدادِ نصبِ بومی در دسترس است. */
  canPrompt: boolean;
  onInstall: () => void;
  onSnooze: () => void;
  onNever: () => void;
  onClose: () => void;
}

const BENEFITS = [
  'بازشدنِ سریع، تمام‌صفحه و بدونِ نوارِ مرورگر',
  'دسترسیِ یک‌لمسی از صفحه‌ی اصلیِ گوشی',
  'تجربه‌ای نزدیک به اپِ نیتیو',
];

/** مودالِ پیشنهادِ نصبِ PWA — روی اندروید/دسکتاپ دکمه‌ی نصب، روی iOS راهنمای دستی. */
export function InstallModal({
  visible,
  isIOS,
  canPrompt,
  onInstall,
  onSnooze,
  onNever,
  onClose,
}: Props) {
  const showNativeButton = canPrompt && !isIOS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="بستن" />
        <View style={[styles.card, shadow.card]}>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="بستن" accessibilityRole="button">
            <Icon name="close" size={18} tint="gold" />
          </Pressable>

          <Image source={APP_ICON} style={styles.icon} contentFit="cover" />
          <Text style={styles.title}>نودوست را نصب کن</Text>
          <Text style={styles.subtitle}>
            نودوست را مثلِ یک اپِ واقعی روی گوشی‌ات داشته باش — سریع‌تر و راحت‌تر.
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Icon name="check" size={15} tint="gold" />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          {isIOS ? (
            <View style={styles.steps}>
              <Step n="۱" text="در نوارِ پایینِ سافاری روی دکمه‌ی «اشتراک‌گذاری» بزن." />
              <Step n="۲" text="گزینه‌ی «Add to Home Screen / افزودن به صفحه‌ی اصلی» را انتخاب کن." />
              <Step n="۳" text="روی «Add / افزودن» بزن — تمام!" />
            </View>
          ) : null}

          <View style={styles.actions}>
            {showNativeButton ? (
              <Button label="نصبِ اپ" variant="gold" onPress={onInstall} />
            ) : (
              <Button label="متوجه شدم" variant="outline" onPress={onSnooze} />
            )}
            <View style={styles.secondaryRow}>
              {showNativeButton ? (
                <Pressable onPress={onSnooze} accessibilityRole="button">
                  <Text style={styles.linkText}>بعداً</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onNever} accessibilityRole="button">
                <Text style={styles.linkMuted}>دیگر نشان نده</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,5,6,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    alignItems: 'center',
  },
  close: { position: 'absolute', top: spacing.md, left: spacing.md, padding: spacing.xs, zIndex: 2 },
  icon: { width: 72, height: 72, borderRadius: radius.lg, marginBottom: spacing.md },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold2, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  benefits: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
  benefitRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  benefitText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'right' },
  steps: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.gold2 },
  stepText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'right', lineHeight: 21 },
  actions: { alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.md },
  secondaryRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: spacing.xl },
  linkText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  linkMuted: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3 },
});
