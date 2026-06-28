import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { useLogin } from '@/presentation/hooks/useLogin';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';

export function LoginScreen() {
  const vm = useLogin();

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>نودوست</Text>
          <Text style={styles.tagline}>دوست‌یابیِ لوکس، نزدیکِ تو</Text>
        </View>

        <View style={styles.form}>
          {vm.step === 'phone' ? (
            <>
              <Text style={styles.label}>شماره‌ی موبایل</Text>
              <TextInput
                style={styles.input}
                value={vm.phone}
                onChangeText={vm.setPhone}
                keyboardType="phone-pad"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                placeholderTextColor={colors.ink3}
                textAlign="right"
              />
              <Button
                label="ارسالِ کدِ تأیید"
                onPress={vm.sendOtp}
                loading={vm.loading}
                style={styles.btn}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>کدِ تأیید را وارد کن</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={vm.code}
                onChangeText={vm.setCode}
                keyboardType="number-pad"
                placeholder="——————"
                placeholderTextColor={colors.ink3}
                textAlign="center"
                maxLength={6}
              />
              {vm.debugCode ? (
                <Text style={styles.debug}>کدِ آزمایشی: {faNum(vm.debugCode)}</Text>
              ) : null}
              <Button label="ورود" onPress={vm.verify} loading={vm.loading} style={styles.btn} />
              <Button
                label="تغییرِ شماره"
                onPress={vm.back}
                variant="outline"
                style={styles.btnSm}
              />
            </>
          )}
          {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  brand: { fontFamily: fonts.bold, fontSize: 44, color: colors.gold, letterSpacing: 1 },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.ink2,
    marginTop: spacing.sm,
  },
  form: { gap: spacing.md },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
  },
  codeInput: { letterSpacing: 8, fontSize: 24 },
  debug: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.gold2, textAlign: 'center' },
  btn: { marginTop: spacing.sm },
  btnSm: { height: 46 },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, textAlign: 'center' },
});
