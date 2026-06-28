import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/presentation/components/Icon';
import { useLogin } from '@/presentation/hooks/useLogin';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';

const GOLD_GRADIENT = ['#F4E1B0', '#DAB877', '#C49E55'] as const;
const CODE_LEN = 4;

export function LoginScreen() {
  const vm = useLogin();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#160F12', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobGold]} />
      <View style={[styles.blob, styles.blobRose]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(560)} style={styles.hero}>
            <View style={styles.markWrap}>
              <Image
                source={require('../../../assets/images/logo-glow.png')}
                style={styles.glow}
                contentFit="contain"
              />
              <View style={styles.mark}>
                <LinearGradient
                  colors={GOLD_GRADIENT}
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

          <Animated.View entering={FadeInUp.delay(180).duration(560)} style={styles.card}>
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
                <GoldButton label="ارسالِ کدِ تأیید" onPress={vm.sendOtp} loading={vm.loading} />
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>کدِ تأیید</Text>
                <Text style={styles.cardSub}>کدِ ارسال‌شده به {faNum(vm.phone)} را وارد کن.</Text>

                <CodeBoxes value={vm.code} onChange={vm.setCode} />

                {vm.debugCode ? <Text style={styles.debug}>کدِ آزمایشی: {faNum(vm.debugCode)}</Text> : null}
                {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}

                <GoldButton
                  label="ورود"
                  onPress={vm.verify}
                  loading={vm.loading}
                  disabled={vm.code.trim().length < 4}
                />
                <Pressable onPress={vm.back} style={styles.changeBtn} accessibilityRole="button">
                  <Text style={styles.changeText}>تغییرِ شماره</Text>
                </Pressable>
              </>
            )}
          </Animated.View>

          <Text style={styles.terms}>با ادامه، شرایطِ استفاده و حریمِ خصوصیِ نودوست را می‌پذیری.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** دکمه‌ی طلاییِ گرادیانی */
function GoldButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [styles.cta, off && styles.ctaOff, pressed && !off && styles.ctaPressed]}
    >
      <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={styles.ctaText}>{loading ? '…' : label}</Text>
    </Pressable>
  );
}

/** ورودیِ کدِ بخش‌بخش (۶ خانه) با ارقامِ فارسی */
function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<TextInput>(null);
  // ترتیبِ خانه‌ها همیشه چپ‌به‌راست خوانده می‌شود (عدد LTR است)؛
  // در RTL ترتیبِ فرزندان را برعکس می‌کنیم تا چیدمانِ flex آن را به LTR برگرداند.
  const order = Array.from({ length: CODE_LEN }, (_, i) => (I18nManager.isRTL ? CODE_LEN - 1 - i : i));
  return (
    <Pressable style={styles.codeRow} onPress={() => ref.current?.focus()}>
      {order.map((idx) => {
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
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },

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
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
  markImg: { width: 50, height: 50 },
  wordmark: { width: 168, height: 50 },
  tagline: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, marginTop: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(243,233,223,0.07)',
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  cardSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink2, marginTop: 6, lineHeight: 22, marginBottom: 22 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, marginBottom: 10, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: colors.ink, fontFamily: fonts.medium, fontSize: 17, letterSpacing: 1 },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, marginTop: 12, textAlign: 'right' },
  debug: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.gold2, textAlign: 'center', marginTop: 12 },

  cta: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 18,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
  ctaOff: { opacity: 0.5 },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onGold },

  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, position: 'relative' },
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
  codeChar: { fontFamily: fonts.bold, fontSize: 22, color: colors.gold2 },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },

  changeBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  changeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.gold },

  terms: { fontFamily: fonts.regular, fontSize: 11, color: colors.ink3, textAlign: 'center', lineHeight: 20, marginTop: 24, paddingHorizontal: 10 },
});
