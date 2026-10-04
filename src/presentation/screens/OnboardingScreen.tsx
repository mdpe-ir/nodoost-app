import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { StepDots } from '@/presentation/components/StepDots';
import { haptics } from '@/core/haptics';
import { PressableScale } from '@/presentation/components/PressableScale';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { Icon } from '@/presentation/components/Icon';
import { InterestPicker } from '@/presentation/components/InterestPicker';
import { PhotoPicker } from '@/presentation/components/PhotoPicker';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { normalizeInviteCode } from '@/presentation/hooks/useInviteViewModel';
import { useCases } from '@/core/di/DIProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { enNum, faNum } from '@/core/utils/faNum';
import { ageFromBirthdate, JALALI_MONTHS, jalaliToIso } from '@/core/utils/jalali';
import { CURRENT_JALALI_YEAR, JalaliDatePicker } from '@/presentation/components/JalaliDatePicker';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import type { Gender } from '@/domain/entities';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];
/**
 * گامِ آخر (کدِ دعوت) فقط وقتی نشان داده می‌شود که سرور دعوت را روشن کرده باشد،
 * پس شمارِ گام‌ها متغیر است. عمداً *آخرین* گام است: کاربرِ تازه اول باید حسابش
 * را بسازد؛ پرسیدنِ کد در گامِ اول، ریزشِ ثبت‌نام می‌سازد.
 */
const BASE_STEPS = 6;
const BIO_MAX = 160;

export function OnboardingScreen() {
  const vm = useOnboarding();
  const { interests: interestsCatalog, missions: missionsCfg } = useRemoteConfig();
  const uc = useCases();
  const referralStep = missionsCfg.enabled && missionsCfg.referralEnabled;
  const STEPS = BASE_STEPS + (referralStep ? 1 : 0);
  const [inviteCode, setInviteCode] = useState('');
  // از اولین گامِ ناقص شروع کن تا کاربرِ نیمه‌کامل مجبور به تکرارِ همه‌چیز نشود.
  const [step, setStep] = useState(() => {
    if (vm.name.trim().length < 2) return 0;
    if (!vm.gender) return 1;
    if (!vm.birthdate) return 2;
    if (!vm.hasPhoto) return 5; // درباره‌ات (۳) و علاقه‌مندی‌ها (۴) اختیاری‌اند
    return 0;
  });
  const [local, setLocal] = useState('');

  function next() {
    setLocal('');
    if (step === 0 && vm.name.trim().length < 2) {
      haptics.warn();
      setLocal('اسمت را وارد کن');
      return;
    }
    if (step === 1 && !vm.gender) {
      haptics.warn();
      setLocal('جنسیت را انتخاب کن');
      return;
    }
    if (step === 2) {
      const iso = jalaliToIso(vm.jalaliDate);
      const age = ageFromBirthdate(iso);
      if (!iso || age == null || age < 18 || age > 99) {
        setLocal('تاریخ تولد را درست وارد کن (۱۸ تا ۹۹ سال)');
        return;
      }
    }
    if (step === 5 && !vm.hasPhoto) {
      haptics.warn();
      setLocal('یک عکس اضافه کن');
      return;
    }
    if (step < STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    // کدِ دعوت اختیاری است و شکستش نباید تکمیلِ پروفایل را نگه دارد؛ اگر کد
    // اشتباه باشد کاربر بعداً از صفحه‌ی «دعوت از دوستان» دوباره امتحان می‌کند.
    if (referralStep) {
      const clean = normalizeInviteCode(inviteCode);
      if (clean.length >= 4) {
        void uc.missions.redeemReferralCode(clean).catch(() => undefined);
      }
    }
    vm.submit();
  }

  const titles = [
    'اسمت چیه؟',
    'خودت رو معرفی کن',
    'تاریخ تولدت چیه؟',
    'یک جمله درباره‌ات',
    'به چه چیزهایی علاقه داری؟',
    'یک عکس اضافه کن',
    ...(referralStep ? ['کدِ دعوت داری؟'] : []),
  ];
  const subs = [
    'این نامی است که دیگران می‌بینند.',
    'برای نمایشِ بهترِ پروفایلت لازم است.',
    'تاریخ تولد شمسی را وارد کن؛ سن دقیق برای نمایش و پیشنهادِ هم‌سن‌ها محاسبه می‌شود.',
    'اختیاری — اما کمک می‌کند بهتر دیده شوی.',
    'اختیاری — اما با انتخابش افرادِ هم‌سلیقه‌ات را خیلی بهتر پیدا می‌کنیم.',
    'برای استفاده از اپ حداقل یک عکس معتبر لازم است؛ عکس تازه بلافاصله فعال می‌شود.',
    ...(referralStep
      ? [
          `اختیاری — اگر کسی تو را دعوت کرده، کدش را وارد کن و ${faNum(
            missionsCfg.referralInviteePoints
          )} امتیازِ هدیه بگیر.`,
        ]
      : []),
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
          <StepDots count={STEPS} index={step} variant="bars" style={styles.progress} />
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
            <View style={styles.birthdateContainer}>
              <View style={styles.pickerWrapper}>
                <JalaliDatePicker
                  value={vm.jalaliDate}
                  onChange={vm.setJalaliDate}
                  minYear={CURRENT_JALALI_YEAR - 99}
                  maxYear={CURRENT_JALALI_YEAR - 18}
                />
              </View>
              <View style={styles.birthdateSummary}>
                <Text style={styles.birthdateConfirmedText}>
                  {`${faNum(vm.jalaliDate.day)} ${JALALI_MONTHS[vm.jalaliDate.month - 1]} ${faNum(vm.jalaliDate.year)}`}
                </Text>
                {(() => {
                  const age = ageFromBirthdate(jalaliToIso(vm.jalaliDate));
                  return age != null ? (
                    <Text style={styles.birthdateAgeText}>
                      ({faNum(age)} ساله)
                    </Text>
                  ) : null;
                })()}
              </View>
            </View>
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
              <PressableScale
                scaleTo={0.98}
                style={styles.photoTile}
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
              </PressableScale>
              <View style={styles.reviewNote}>
                <Icon name="shield" size={14} tint="gold" />
                <Text style={styles.reviewText}>اگر عکس خلاف قوانین باشد، مدیر آن را همراه با دلیل رد می‌کند.</Text>
              </View>
              {vm.rejectionReasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.rejectionReason}>دلیل رد عکس قبلی: {reason}</Text>
              ))}
            </View>
          ) : null}

          {referralStep && step === BASE_STEPS ? (
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="مثلاً AB3D4F"
              placeholderTextColor={colors.ink3}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={styles.inviteInput}
            />
          ) : null}

          {err ? <Text style={styles.error}>{err}</Text> : null}
        </Animated.View>

        <View style={styles.footer}>
          <Button label={step < STEPS - 1 ? 'ادامه' : 'پایان'} onPress={next} loading={vm.loading} />
          {step > 0 ? (
            <PressableScale
              scaleTo={0.9}
              onPress={() => setStep((s) => s - 1)}
              style={styles.backBtn}
              accessibilityRole="button"
            >
              <Icon name="chevron-next" size={16} tint="gold" />
              <Text style={styles.backText}>گامِ قبلی</Text>
            </PressableScale>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      {/* برگه‌ی دوربین/گالری + ویرایشگرِ برش — تنها راهِ افزودنِ عکس در این گام. */}
      <PhotoPicker
        visible={vm.pickerOpen}
        onClose={vm.closePicker}
        onPicked={vm.onPhotoPicked}
        onError={vm.setError}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingVertical: spacing.lg },
  progress: { flexDirection: 'row-reverse', gap: spacing.sm },
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
    borderTopColor: colors.rim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 17,
    // جهتِ نوشتار rtl تا placeholder و متنِ فارسی درست چیده شوند
    writingDirection: 'rtl',
  },
  birthdateContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  pickerWrapper: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  birthdateSummary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  birthdateConfirmedText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.gold2,
  },
  birthdateAgeText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
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
  inviteInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
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
  backText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
});
