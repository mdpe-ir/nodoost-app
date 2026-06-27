import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Auth } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { setSession } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setError('');
    if (phone.trim().length < 10) {
      setError('شماره‌ی موبایلت را درست وارد کن');
      return;
    }
    setLoading(true);
    try {
      const r = await Auth.requestOtp(phone.trim());
      if (r?.debug_code) setCode(r.debug_code);
      setStep('code');
    } catch {
      setError('ارسالِ کد ناموفق بود. دوباره امتحان کن.');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError('');
    setLoading(true);
    try {
      const r = await Auth.verifyOtp(phone.trim(), code.trim());
      const me = await setSession(r.access_token, r.refresh_token);
      if (!me) {
        setError('ورود ناموفق بود');
        return;
      }
      if (me.status !== 'active') router.replace('/suspended');
      else if (!me.name) router.replace('/onboarding');
      else router.replace('/(tabs)/discover');
    } catch {
      setError('کد درست نیست');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.wrap, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>نودوست</Text>
        <Text style={styles.tagline}>دوست‌یابیِ لوکس، نزدیکِ تو</Text>
      </View>

      <View style={styles.form}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>شماره‌ی موبایل</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              placeholderTextColor={colors.ink3}
              style={styles.input}
              textAlign="right"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="ارسالِ کدِ تأیید" onPress={sendOtp} loading={loading} style={styles.btn} />
          </>
        ) : (
          <>
            <Text style={styles.label}>کدِ تأیید را وارد کن</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="------"
              placeholderTextColor={colors.ink3}
              style={[styles.input, styles.code]}
              textAlign="center"
              maxLength={6}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="ورود" onPress={verify} loading={loading} style={styles.btn} />
            <Button
              label="تغییرِ شماره"
              variant="ghost"
              onPress={() => setStep('phone')}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 26, backgroundColor: colors.bg, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  brand: { fontFamily: fonts.bold, fontSize: 40, color: colors.gold2, letterSpacing: 1 },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginTop: 10 },
  form: { marginBottom: 30 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2, marginBottom: 10 },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 17,
  },
  code: { letterSpacing: 8, fontSize: 22 },
  btn: { marginTop: 14 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.rose, marginTop: 10 },
});
