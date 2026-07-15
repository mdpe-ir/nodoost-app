import React, { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/presentation/components/Icon';
import { Button } from '@/presentation/components/Button';
import { useLogin } from '@/presentation/hooks/useLogin';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, gradients, shadow } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';

const CODE_LEN = 4;

export function LoginScreen() {
  const vm = useLogin();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#141020', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobGold]} />
      <View style={[styles.blob, styles.blobRose]} />

      {/*
       * KeyboardAwareScrollView (نه نسخه‌ی خودِ RN): چون اپ edge-to-edge است،
       * adjustResize کار نمی‌کند و KeyboardAvoidingView روی اندروید بی‌اثر بود —
       * کیبورد روی فیلد می‌افتاد و صفحه اسکرول نمی‌شد. این کامپوننت ارتفاعِ کیبورد
       * را مستقیم می‌خواند و تا فیلدِ فوکوس‌شده اسکرول می‌کند.
       */}
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        <Animated.View entering={FadeInDown.duration(560)} style={styles.hero}>
          <View style={styles.markWrap}>
            <Image
              source={require('../../../assets/images/logo-glow.png')}
              style={styles.glow}
              contentFit="contain"
            />
            <View style={[styles.mark, shadow.gold]}>
              <LinearGradient
                colors={gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={require('../../../assets/logo/logo-mark-white.png')}
                style={styles.markImg}
                contentFit="contain"
              />
            </View>
          </View>
          <Image
            source={require('../../../assets/logo/wordmark-on-dark.png')}
            style={styles.wordmark}
            contentFit="contain"
          />
          <Text style={styles.tagline}>دوست‌یابیِ لوکس، نزدیکِ تو</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(560)} style={[styles.card, shadow.card]}>
          {vm.step === 'phone' ? (
            <>
              <Text style={styles.cardTitle}>ورود یا ثبت‌نام</Text>
              <Text style={styles.cardSub}>شماره‌ات را وارد کن تا کدِ تأیید برایت بفرستیم.</Text>

              <Text style={styles.label}>شماره‌ی موبایل</Text>
              <View style={styles.inputRow}>
                <Icon name="phone" size={18} tint="gold" />
                <TextInput
                  style={styles.input}
                  value={vm.phone}
                  onChangeText={vm.setPhone}
                  keyboardType="phone-pad"
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  placeholderTextColor={colors.ink3}
                  textAlign="right"
                  maxLength={13}
                />
              </View>

              {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
              <Button label="ارسالِ کدِ تأیید" onPress={vm.sendOtp} loading={vm.loading} style={styles.cta} />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>کدِ تأیید</Text>
              <Text style={styles.cardSub}>کدِ ارسال‌شده به {faNum(vm.phone)} را وارد کن.</Text>

              <CodeBoxes value={vm.code} onChange={vm.setCode} />

              {vm.debugCode ? <Text style={styles.debug}>کدِ آزمایشی: {faNum(vm.debugCode)}</Text> : null}
              {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}

              <Button
                label="ورود"
                onPress={vm.verify}
                loading={vm.loading}
                disabled={vm.code.trim().length < CODE_LEN}
                style={styles.cta}
              />
              <View style={styles.codeFooter}>
                <Pressable onPress={vm.back} style={styles.footerBtn} accessibilityRole="button">
                  <Text style={styles.footerBtnText}>تغییرِ شماره</Text>
                </Pressable>
                {vm.resendIn > 0 ? (
                  <Text style={styles.resendWait}>ارسالِ دوباره تا {faNum(vm.resendIn)} ثانیه</Text>
                ) : (
                  <Pressable onPress={vm.sendOtp} style={styles.footerBtn} accessibilityRole="button">
                    <Text style={styles.footerBtnText}>ارسالِ دوباره‌ی کد</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Animated.View>

        <Text style={styles.terms}>با ادامه، شرایطِ استفاده و حریمِ خصوصیِ نودوست را می‌پذیری.</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

/**
 * ورودیِ کدِ بخش‌بخش با ارقامِ فارسی.
 * ردیفِ خانه‌ها عمداً LTR است (عدد چپ‌به‌راست خوانده می‌شود)؛ چون جهتِ پایه‌ی
 * اپ در همه‌ی پلتفرم‌ها LTR است، flexDirection:'row' همین را تضمین می‌کند.
 */
function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable style={styles.codeRow} onPress={() => ref.current?.focus()}>
      {Array.from({ length: CODE_LEN }, (_, idx) => {
        const ch = value[idx];
        const active = idx === value.length;
        return (
          <View key={idx} style={[styles.codeBox, ch ? styles.codeBoxFilled : null, active && styles.codeBoxActive]}>
            <Text style={styles.codeChar}>{ch ? faNum(ch) : ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, CODE_LEN))}
        keyboardType="number-pad"
        maxLength={CODE_LEN}
        style={styles.hiddenInput}
        autoFocus
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },

  blob: { position: 'absolute', width: 340, height: 340, borderRadius: 170 },
  blobGold: { backgroundColor: colors.gold, top: -120, right: -90, opacity: 0.16 },
  blobRose: { backgroundColor: colors.rose, bottom: -140, left: -110, opacity: 0.1 },

  hero: { alignItems: 'center', marginBottom: 34 },
  markWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  glow: { position: 'absolute', width: 220, height: 220, opacity: 0.55 },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markImg: { width: 50, height: 50 },
  wordmark: { width: 168, height: 50 },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    marginTop: spacing.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    marginTop: spacing.xs,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.xl - 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    marginBottom: spacing.sm + 2,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, color: colors.ink, fontFamily: fonts.medium, fontSize: 17, letterSpacing: 1 },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.rose,
    marginTop: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  debug: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.gold2,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  cta: { marginTop: spacing.lg + 2 },

  // ردیفِ کد عمداً row (چپ‌به‌راست) است — عدد LTR خوانده می‌شود.
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, position: 'relative' },
  codeBox: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxFilled: { borderColor: colors.goldSoft },
  codeBoxActive: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  codeChar: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold2 },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },

  codeFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerBtn: { paddingVertical: spacing.md },
  footerBtnText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
  resendWait: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },

  terms: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: lineHeights.xs + 2,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
    writingDirection: 'rtl',
  },
});
