import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { Icon } from '@/presentation/components/Icon';
import { InterestPicker } from '@/presentation/components/InterestPicker';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import type { Gender } from '@/domain/entities';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];
const STEPS = 6;
const BIO_MAX = 160;

export function OnboardingScreen() {
  const vm = useOnboarding();
  const { interests: interestsCatalog } = useRemoteConfig();
  // از اولین گامِ ناقص شروع کن تا کاربرِ نیمه‌کامل مجبور به تکرارِ همه‌چیز نشود.
  const [step, setStep] = useState(() => {
    if (vm.name.trim().length < 2) return 0;
    if (!vm.gender) return 1;
    if (!vm.age) return 2;
    if (!vm.hasPhoto) return 5; // درباره‌ات (۳) و علاقه‌مندی‌ها (۴) اختیاری‌اند
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
    if (step === 5 && !vm.hasPhoto) {
      setLocal('یک عکس اضافه کن');
      return;
    }
    if (step < STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    vm.submit();
  }

  const titles = [
    'اسمت چیه؟',
    'خودت رو معرفی کن',
    'چند سالته؟',
    'یک جمله درباره‌ات',
    'به چه چیزهایی علاقه داری؟',
    'یک عکس اضافه کن',
  ];
  const subs = [
    'این نامی است که دیگران می‌بینند.',
    'برای نمایشِ بهترِ پروفایلت لازم است.',
    'سن برای نمایش و پیشنهادِ افرادِ هم‌سن لازم است.',
    'اختیاری — اما کمک می‌کند بهتر دیده شوی.',
    'اختیاری — اما با انتخابش افرادِ هم‌سلیقه‌ات را خیلی بهتر پیدا می‌کنیم.',
    'برای استفاده از اپ حداقل یک عکس معتبر لازم است؛ عکس تازه بلافاصله فعال می‌شود.',
  ];
  const err = local || vm.error;

  return (
    <ScreenContainer>
      {/*
       * KeyboardAvoidingView از react-native-keyboard-controller — نسخه‌ی خودِ RN
       * روی اندرویدِ edge-to-edge بی‌اثر است (adjustResize نادیده گرفته می‌شود).
       * behavior="padding" روی هر دو پلتفرم: این نسخه ارتفاعِ کیبورد را مستقیم می‌خواند.
       */}
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View>
          {/* نوارِ پیشرفت راست‌به‌چپ پر می‌شود — هم‌جهت با خواندنِ فارسی */}
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
              {GENDERS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  active={vm.gender === g.key}
                  onPress={() => vm.setGender(g.key)}
                  style={styles.genderChip}
                />
              ))}
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
            <>
              <TextInput
                style={[styles.input, styles.bio]}
                value={vm.bio}
                onChangeText={vm.setBio}
                placeholder="چند کلمه از خودت بنویس…"
                placeholderTextColor={colors.ink3}
                textAlign="right"
                multiline
                maxLength={BIO_MAX}
              />
              <Text style={styles.bioCount}>{faNum(vm.bio.length)} / {faNum(BIO_MAX)}</Text>
            </>
          ) : null}

          {step === 4 ? (
            <ScrollView style={styles.interestsScroll} showsVerticalScrollIndicator={false}>
              <InterestPicker
                options={interestsCatalog}
                value={vm.interests}
                onChange={vm.setInterests}
              />
            </ScrollView>
          ) : null}

          {step === 5 ? (
            <View style={styles.photoStep}>
              <Pressable
                style={({ pressed }) => [styles.photoTile, pressed && styles.photoTilePressed]}
                onPress={vm.pickPhoto}
                accessibilityRole="button"
                accessibilityLabel="افزودنِ عکس"
              >
                {vm.photoUri ? (
                  <>
                    <Image source={{ uri: vm.photoUri }} style={styles.photoImg} contentFit="cover" transition={200} />
                    <View style={styles.photoEditTag}>
                      <Icon name="edit" size={13} tint="ink" />
                      <Text style={styles.photoEditText}>تغییرِ عکس</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.photoEmpty}>
                    <Icon name="plus" size={30} tint="gold" />
                    <Text style={styles.photoHint}>انتخابِ عکس</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.reviewNote}>
                <Icon name="shield" size={14} tint="gold" />
                <Text style={styles.reviewText}>اگر عکس خلاف قوانین باشد، مدیر آن را همراه با دلیل رد می‌کند.</Text>
              </View>
              {vm.rejectionReasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.rejectionReason}>دلیل رد عکس قبلی: {reason}</Text>
              ))}
            </View>
          ) : null}

          {err ? <Text style={styles.error}>{err}</Text> : null}
        </Animated.View>

        <View style={styles.footer}>
          <Button label={step < STEPS - 1 ? 'ادامه' : 'پایان'} onPress={next} loading={vm.loading} />
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityRole="button"
            >
              <Icon name="chevron-next" size={16} tint="gold" />
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
  progress: { flexDirection: 'row-reverse', gap: spacing.sm },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface2 },
  segOn: { backgroundColor: colors.gold },
  stepLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  body: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
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
    // جهتِ نوشتار rtl تا placeholder و متنِ فارسی درست چیده شوند
    writingDirection: 'rtl',
  },
  bio: { minHeight: 120, textAlignVertical: 'top' },
  interestsScroll: { flexGrow: 0, maxHeight: 380 },
  bioCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'left',
    marginTop: spacing.sm,
  },
  genderRow: { flexDirection: 'row-reverse', gap: spacing.md },
  genderChip: { flex: 1, minHeight: 56 },
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
  photoTilePressed: { opacity: 0.85 },
  photoImg: { width: '100%', height: '100%' },
  photoEditTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 5,
    backgroundColor: colors.goldSoft,
  },
  photoEditText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  photoHint: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  reviewNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  reviewText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  rejectionReason: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
  },
  footer: { gap: spacing.md },
  backBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  backBtnPressed: { opacity: 0.7 },
  backText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
});
