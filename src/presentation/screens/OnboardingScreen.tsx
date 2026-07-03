import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';
import type { Gender } from '@/domain/entities';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];
const STEPS = 5;

export function OnboardingScreen() {
  const vm = useOnboarding();
  // از اولین گامِ ناقص شروع کن تا کاربرِ نیمه‌کامل مجبور به تکرارِ همه‌چیز نشود.
  const [step, setStep] = useState(() => {
    if (vm.name.trim().length < 2) return 0;
    if (!vm.gender) return 1;
    if (!vm.age) return 2;
    if (!vm.hasPhoto) return 4; // درباره‌ات (گامِ ۳) اختیاری است
    return 0;
  });
  const [local, setLocal] = useState('');

  function next() {
    setLocal('');
    if (step === 0 && vm.name.trim().length < 2) {
      setLocal('اسمت را وارد کن');
      return;
    }
    if (step === 1 && !vm.gender) {
      setLocal('جنسیت را انتخاب کن');
      return;
    }
    if (step === 2) {
      const a = Number(vm.age);
      if (!Number.isFinite(a) || a < 18 || a > 99) {
        setLocal('سنت را درست وارد کن (۱۸ تا ۹۹)');
        return;
      }
    }
    if (step === 4 && !vm.hasPhoto) {
      setLocal('یک عکس اضافه کن');
      return;
    }
    if (step < STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    vm.submit();
  }

  const titles = ['اسمت چیه؟', 'خودت رو معرفی کن', 'چند سالته؟', 'یک جمله درباره‌ات', 'یک عکس اضافه کن'];
  const subs = [
    'این نامی است که دیگران می‌بینند.',
    'برای نمایشِ بهترِ پروفایلت لازم است.',
    'سن برای نمایش و پیشنهادِ افرادِ هم‌سن لازم است.',
    'اختیاری — اما کمک می‌کند بهتر دیده شوی.',
    'برای استفاده از اپ حداقل یک عکس لازم است. پس از تأییدِ مدیر به دیگران نشان داده می‌شود.',
  ];
  const err = local || vm.error;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.progress}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View key={i} style={[styles.seg, i <= step && styles.segOn]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>گامِ {faNum(step + 1)} از {faNum(STEPS)}</Text>
        </View>

        <Animated.View key={step} entering={FadeInDown.duration(260)} style={styles.body}>
          <Text style={styles.title}>{titles[step]}</Text>
          <Text style={styles.sub}>{subs[step]}</Text>

          {step === 0 ? (
            <TextInput
              style={styles.input}
              value={vm.name}
              onChangeText={vm.setName}
              placeholder="مثلاً نیلوفر"
              placeholderTextColor={colors.ink3}
              textAlign="right"
              autoFocus
            />
          ) : null}

          {step === 1 ? (
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const active = vm.gender === g.key;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => vm.setGender(g.key)}
                    style={[styles.genderBtn, active && styles.genderActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {step === 2 ? (
            <TextInput
              style={styles.input}
              value={vm.age}
              onChangeText={(t) => vm.setAge(t.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="مثلاً ۲۶"
              placeholderTextColor={colors.ink3}
              keyboardType="number-pad"
              textAlign="right"
              autoFocus
              maxLength={2}
            />
          ) : null}

          {step === 3 ? (
            <TextInput
              style={[styles.input, styles.bio]}
              value={vm.bio}
              onChangeText={vm.setBio}
              placeholder="چند کلمه از خودت بنویس…"
              placeholderTextColor={colors.ink3}
              textAlign="right"
              multiline
              maxLength={160}
            />
          ) : null}

          {step === 4 ? (
            <View style={styles.photoStep}>
              <Pressable
                style={styles.photoTile}
                onPress={vm.pickPhoto}
                accessibilityRole="button"
                accessibilityLabel="افزودنِ عکس"
              >
                {vm.photoUri ? (
                  <Image source={{ uri: vm.photoUri }} style={styles.photoImg} contentFit="cover" transition={200} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Icon name="plus" size={30} tint="gold" />
                    <Text style={styles.photoHint}>انتخابِ عکس</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.reviewNote}>
                <Icon name="shield" size={14} tint="gold" />
                <Text style={styles.reviewText}>عکس‌ها پیش از نمایش به دیگران توسطِ مدیر بررسی می‌شوند.</Text>
              </View>
            </View>
          ) : null}

          {err ? <Text style={styles.error}>{err}</Text> : null}
        </Animated.View>

        <View style={styles.footer}>
          <Button label={step < STEPS - 1 ? 'ادامه' : 'پایان'} onPress={next} loading={vm.loading} />
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => s - 1)} style={styles.backBtn} accessibilityRole="button">
              <Icon name="chevron-prev" size={16} tint="gold" />
              <Text style={styles.backText}>گامِ قبلی</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingVertical: spacing.lg },
  top: {},
  progress: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface2 },
  segOn: { backgroundColor: colors.gold },
  stepLabel: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, marginTop: spacing.md, textAlign: 'right' },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.ink, textAlign: 'right' },
  sub: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, textAlign: 'right', marginTop: spacing.sm, marginBottom: spacing.xl },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 17,
  },
  bio: { minHeight: 120, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row-reverse', gap: spacing.md },
  genderBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderActive: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  genderText: { fontFamily: fonts.medium, fontSize: 17, color: colors.ink2 },
  genderTextActive: { color: colors.gold2 },
  photoStep: { alignItems: 'center' },
  photoTile: {
    width: 168,
    height: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  photoHint: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  reviewNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  reviewText: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink2, textAlign: 'right', flexShrink: 1 },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, textAlign: 'right', marginTop: spacing.lg },
  footer: { gap: spacing.md },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  backText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
});
