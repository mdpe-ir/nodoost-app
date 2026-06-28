import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';
import type { Gender } from '@/domain/entities';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export function OnboardingScreen() {
  const vm = useOnboarding();

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>بذار آشنا شیم</Text>
          <Text style={styles.sub}>چند قدم تا پروفایلِ تو</Text>

          <Text style={styles.label}>اسمت</Text>
          <TextInput
            style={styles.input}
            value={vm.name}
            onChangeText={vm.setName}
            placeholder="مثلاً نیلوفر"
            placeholderTextColor={colors.ink3}
            textAlign="right"
          />

          <Text style={styles.label}>جنسیت</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const active = vm.gender === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => vm.setGender(g.key)}
                  style={[styles.genderBtn, active && styles.genderActive]}
                >
                  <Text style={[styles.genderText, active && styles.genderTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>درباره‌ات (اختیاری)</Text>
          <TextInput
            style={[styles.input, styles.bio]}
            value={vm.bio}
            onChangeText={vm.setBio}
            placeholder="چند کلمه از خودت بنویس…"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            multiline
          />

          {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
          <Button label="ادامه" onPress={vm.submit} loading={vm.loading} style={styles.btn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.ink, textAlign: 'right' },
  sub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.ink3,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
  },
  bio: { height: 110, paddingTop: spacing.md, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row-reverse', gap: spacing.md },
  genderBtn: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderActive: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  genderText: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink2 },
  genderTextActive: { color: colors.gold2 },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  btn: { marginTop: spacing.xl },
});
