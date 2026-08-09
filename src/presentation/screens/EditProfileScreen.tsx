import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { router, type Href } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Button } from '@/presentation/components/Button';
import { SettingsGroup, SettingsLink } from '@/presentation/components/SettingsRow';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { faNum } from '@/core/utils/faNum';
import { MAX_INTERESTS } from '@/core/config/interestsCatalog';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

const BIO_MAX = 160;

/**
 * ویرایشِ پروفایل — نام، معرفی و علاقه‌مندی‌ها.
 *
 * پیش‌تر این فرم زبانه‌ی وسطیِ صفحه‌ی «من» بود؛ زدنِ دکمه‌ی «ویرایشِ پروفایل»
 * فقط زبانه را عوض می‌کرد و کاربر متوجه نمی‌شد که چیزی اتفاق افتاده. حالا یک
 * صفحه‌ی مستقل است: باز می‌شود، ذخیره می‌کنی، برمی‌گردی.
 */
export function EditProfileScreen() {
  // عکس‌ها و شمارنده‌ها این‌جا لازم نیستند.
  const vm = useProfileViewModel({ skipMedia: true });
  const insets = useSafeAreaInsets();

  const tooShort = vm.draftName.trim().length < 2;
  /* از نشست خوانده می‌شود، نه از پیش‌نویسِ این صفحه: علاقه‌مندی‌ها در صفحه‌ی
     دیگری ذخیره می‌شوند و این خلاصه باید بلافاصله پس از بازگشت درست باشد. */
  const savedInterests = vm.user?.interests ?? [];

  /*
   * نوارِ ذخیره با کیبورد بالا می‌آید. اپ edge-to-edge است، پس پنجره با بازشدنِ
   * کیبورد کوچک نمی‌شود و بدونِ این، دکمه زیرِ کیبورد گم می‌شد. `max` با
   * insets.bottom چون ارتفاعِ گزارش‌شده‌ی کیبورد ناحیه‌ی نوارِ ناوبری را هم در
   * خود دارد — همان الگوی نوارِ نوشتنِ گفتگو.
   */
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const saveBarStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(-keyboardHeight.value, insets.bottom) + spacing.md,
  }));

  const save = async () => {
    const ok = await vm.saveProfile();
    if (ok) router.back();
  };

  return (
    <ScreenContainer>
      <StackHeader title="ویرایشِ پروفایل" />
      <KeyboardAwareScrollView
        bottomOffset={spacing.xxl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lead}>
          این‌ها همان چیزهایی‌اند که دیگران در پروفایلت می‌بینند.
        </Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>نام</Text>
          <TextInput
            style={styles.input}
            value={vm.draftName}
            onChangeText={vm.setDraftName}
            placeholder="نامت را بنویس"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            maxLength={40}
          />
          {tooShort ? <Text style={styles.fieldError}>نام باید دستِ‌کم دو نویسه باشد.</Text> : null}

          <Text style={styles.fieldLabel}>درباره‌ات</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={vm.draftBio}
            onChangeText={vm.setDraftBio}
            placeholder="چند کلمه از خودت بنویس…"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            multiline
            maxLength={BIO_MAX}
          />
          <Text style={styles.bioCount}>{faNum(vm.draftBio.length)} / {faNum(BIO_MAX)}</Text>
        </View>

        {/* علاقه‌مندی‌ها صفحه‌ی خودش را دارد: سی‌وچند چیپ، بلندترین بخشِ این فرم
            بود و نام و بیو را از دید بیرون می‌راند. این‌جا فقط خلاصه‌اش می‌آید. */}
        <SettingsGroup title="بیشتر">
          <SettingsLink
            icon="star"
            title="علاقه‌مندی‌ها"
            hint={savedInterests.length ? savedInterests.join('، ') : 'هنوز چیزی انتخاب نکرده‌ای'}
            value={`${faNum(savedInterests.length)} از ${faNum(MAX_INTERESTS)}`}
            onPress={() => router.push('/interests' as Href)}
          />
          <SettingsLink
            icon="edit"
            title="عکس‌های من"
            hint="افزودن، حذف و انتخابِ عکسِ اصلی"
            onPress={() => router.push('/photos' as Href)}
          />
        </SettingsGroup>

        {vm.saveError ? <Text style={styles.saveError}>ذخیره ناموفق بود. دوباره تلاش کن.</Text> : null}
      </KeyboardAwareScrollView>

      {/* نوارِ ذخیره همیشه در دید است — با فرمِ بلند، دکمه‌ی ته‌ی اسکرول دیده نمی‌شد. */}
      <Animated.View style={[styles.saveBar, saveBarStyle]}>
        <Button
          label="ذخیره‌ی تغییرات"
          size="md"
          onPress={save}
          loading={vm.saving}
          disabled={!vm.dirty || tooShort}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2 },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  fieldHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldError: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.rose, textAlign: 'right' },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    writingDirection: 'rtl',
  },
  bioInput: { minHeight: 104, textAlignVertical: 'top' },
  bioCount: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'left' },
  saveError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  saveBar: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
});
