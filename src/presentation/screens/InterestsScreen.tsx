import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Button } from '@/presentation/components/Button';
import { InterestPicker } from '@/presentation/components/InterestPicker';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { faNum } from '@/core/utils/faNum';
import { MAX_INTERESTS } from '@/core/config/interestsCatalog';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

/**
 * انتخابِ علاقه‌مندی‌ها.
 *
 * تا این‌جا یک کارت در دلِ فرمِ ویرایشِ پروفایل بود و بلندترین بخشِ آن صفحه:
 * سی‌وچند چیپ که نام و بیو را به بالای اسکرول می‌راندند. حالا صفحه‌ی خودش را
 * دارد و فقط همین یک فیلد را ذخیره می‌کند.
 */
export function InterestsScreen() {
  const vm = useProfileViewModel({ skipMedia: true });
  const { interests: interestsCatalog } = useRemoteConfig();
  const insets = useSafeAreaInsets();

  // نوارِ ذخیره با کیبورد بالا می‌آید — همان الگوی صفحه‌ی ویرایشِ پروفایل.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const saveBarStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(-keyboardHeight.value, insets.bottom) + spacing.md,
  }));

  const save = async () => {
    const ok = await vm.saveInterests();
    if (ok) router.back();
  };

  return (
    <ScreenContainer>
      <StackHeader title="علاقه‌مندی‌ها" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>
          تا {faNum(MAX_INTERESTS)} مورد انتخاب کن. با علاقه‌مندی‌های مشترک، افرادِ هم‌سلیقه‌ات را
          بهتر پیدا می‌کنیم و در پروفایلِ یکدیگر هم دیده می‌شوند.
        </Text>
        <View style={styles.picker}>
          <InterestPicker
            options={interestsCatalog}
            value={vm.draftInterests}
            onChange={vm.setDraftInterests}
          />
        </View>
        {vm.saveError ? <Text style={styles.saveError}>ذخیره ناموفق بود. دوباره تلاش کن.</Text> : null}
      </ScrollView>

      <Animated.View style={[styles.saveBar, saveBarStyle]}>
        <Button
          label="ذخیره‌ی علاقه‌مندی‌ها"
          size="md"
          onPress={save}
          loading={vm.saving}
          disabled={!vm.interestsDirty}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  picker: { marginBottom: spacing.md },
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
