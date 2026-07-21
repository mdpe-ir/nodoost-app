import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

/** درخششِ بالای کارت — ثابت بیرون از رندر تا تایپِ tuple برای LinearGradient حفظ شود. */
const CARD_GLOW = ['rgba(218,184,119,0.16)', 'rgba(218,184,119,0)'] as const;

/** مرحله‌های پیش‌پرسش — هر کدام متن و دکمه‌ی خودش را دارد. */
export type PrimerStage = 'ask' | 'requesting' | 'blocked' | 'granted';

const BENEFITS: { icon: IconName; title: string; hint: string }[] = [
  {
    icon: 'map',
    title: 'آدم‌های نزدیکِ خودت',
    hint: 'به‌جای کلِ ایران، کسانی را ببین که واقعاً می‌توانی ببینی‌شان.',
  },
  {
    icon: 'heart-fill',
    title: 'پیشنهادهای دقیق‌تر',
    hint: 'فاصله یکی از مهم‌ترین سیگنال‌های ماست؛ بدونِ آن مچ‌ها تصادفی می‌شوند.',
  },
  {
    icon: 'shield-check',
    title: 'حریمِ خصوصیِ تو محفوظ است',
    hint: 'هیچ‌وقت آدرس یا نقطه‌ی دقیقت نمایش داده نمی‌شود — فقط فاصله‌ی تقریبی.',
  },
];

/**
 * پیش‌پرسشِ موقعیت (soft-ask) — پیش از دیالوگِ سیستمی، با زبانِ خودمان توضیح می‌دهد
 * چرا موقعیت لازم است. دلیلِ وجودش صرفاً زیبایی نیست: دیالوگِ سیستمیِ اندروید/iOS
 * فقط یک‌بار قابلِ نمایش است و «رد» شدنِ آن تقریباً برگشت‌ناپذیر است. پس اول انگیزه
 * می‌سازیم، بعد دیالوگِ سیستمی را باز می‌کنیم.
 *
 * این کامپوننت حالتِ محضِ نمایشی است؛ منطق و ماندگاری در LocationPrimerProvider است.
 */
export function LocationPermissionModal({
  visible,
  stage,
  onAllow,
  onLater,
  onOpenSettings,
}: {
  visible: boolean;
  stage: PrimerStage;
  onAllow: () => void;
  onLater: () => void;
  onOpenSettings: () => void;
}) {
  const enter = useSharedValue(0);
  const pulse = useSharedValue(0);
  const success = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      return;
    }
    enter.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [visible, enter, pulse]);

  useEffect(() => {
    if (stage !== 'granted') return;
    success.value = withSequence(
      withTiming(1.12, { duration: 260, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 180 })
    );
  }, [stage, success]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 28 }, { scale: 0.94 + enter.value * 0.06 }],
  }));
  // دو حلقه‌ی هم‌مرکز با اختلافِ فاز، حسِ «سیگنالِ زنده» می‌دهند.
  const ring1Style = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.5,
    transform: [{ scale: 0.7 + pulse.value * 0.75 }],
  }));
  const ring2Style = useAnimatedStyle(() => {
    const p = (pulse.value + 0.5) % 1;
    return { opacity: (1 - p) * 0.35, transform: [{ scale: 0.7 + p * 0.75 }] };
  });
  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: success.value || 1 }] }));

  const isGranted = stage === 'granted';
  const isBlocked = stage === 'blocked';

  const title = isGranted
    ? 'عالی شد!'
    : isBlocked
      ? 'دسترسی به موقعیت بسته است'
      : 'برای مچ‌های بهتر، موقعیتت را لازم داریم';

  const body = isGranted
    ? 'از حالا آدم‌های نزدیکِ خودت را می‌بینی و پیشنهادها دقیق‌تر می‌شوند.'
    : isBlocked
      ? 'مجوزِ موقعیت قبلاً رد شده و اپ نمی‌تواند دوباره بپرسد. با یک ضربه به تنظیمات برو و «موقعیتِ مکانی» را روشن کن.'
      : 'نودوست بر پایه‌ی نزدیکی کار می‌کند. با روشن‌کردنِ موقعیت، به‌جای کاربرانِ تصادفی، آدم‌هایی را می‌بینی که واقعاً نزدیکِ تو هستند.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, shadow.card, cardStyle]}>
          {/* درخششِ ملایمِ طلایی در بالای کارت — همان زبانِ بصریِ اسپلش */}
          <LinearGradient
            colors={CARD_GLOW}
            style={styles.cardGlow}
            pointerEvents="none"
          />

          <View style={styles.hero}>
            <Animated.View style={[styles.ring, ring1Style]} pointerEvents="none" />
            <Animated.View style={[styles.ring, ring2Style]} pointerEvents="none" />
            <Animated.View style={[styles.disc, discStyle]}>
              <Icon name={isGranted ? 'check' : isBlocked ? 'lock' : 'map'} size={34} tint="gold" />
            </Animated.View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          {!isGranted ? (
            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b.icon} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Icon name={b.icon} size={16} tint="gold" />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitHint}>{b.hint}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {!isGranted ? (
            <View style={styles.actions}>
              <Button
                label={isBlocked ? 'رفتن به تنظیمات' : 'اجازه می‌دهم'}
                icon={isBlocked ? 'chevron-next' : 'map'}
                loading={stage === 'requesting'}
                onPress={isBlocked ? onOpenSettings : onAllow}
                style={styles.btnFull}
              />
              <Pressable onPress={onLater} disabled={stage === 'requesting'} hitSlop={8}>
                <Text style={styles.later}>الان نه</Text>
              </Pressable>
            </View>
          ) : null}

          {!isGranted ? (
            <Text style={styles.footnote}>
              هر وقت خواستی می‌توانی از تنظیماتِ گوشی این دسترسی را ببندی.
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const DISC = 88;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(7,5,11,0.82)',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },

  hero: { height: DISC + 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  ring: {
    position: 'absolute',
    width: DISC + 28,
    height: DISC + 28,
    borderRadius: (DISC + 28) / 2,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  body: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  benefits: {
    marginTop: spacing.lg,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  benefitRow: { flexDirection: 'row-reverse', gap: spacing.md },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
  },
  benefitText: { flex: 1 },
  benefitTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  benefitHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  actions: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'center' },
  btnFull: { width: '100%' },
  later: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: spacing.xs,
  },
  footnote: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
