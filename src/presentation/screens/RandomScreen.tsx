import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { useRandomViewModel } from '@/presentation/hooks/useRandomViewModel';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

const OPTIONS: { key: '' | 'f' | 'm'; label: string }[] = [
  { key: '', label: 'فرقی نداره' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export function RandomScreen() {
  const vm = useRandomViewModel();

  return (
    <ScreenContainer>
      <Text style={styles.title}>تصادفی</Text>
      <Text style={styles.sub}>با یک غریبه‌ی نزدیک، گفتگوی زنده را شروع کن</Text>

      <Text style={styles.label}>ترجیحِ جنسیتِ هم‌صحبت</Text>
      <View style={styles.row}>
        {OPTIONS.map((o) => {
          const active = vm.gender === o.key;
          return (
            <Pressable
              key={o.key || 'any'}
              onPress={() => vm.setGender(o.key)}
              style={[styles.chip, active && styles.chipActive]}
              disabled={vm.state === 'waiting'}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {vm.state === 'waiting' ? (
          <View style={styles.waiting}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.waitingText}>در حالِ پیدا کردنِ هم‌صحبت…</Text>
            <Button label="لغو" onPress={vm.leave} variant="outline" style={styles.cancel} />
          </View>
        ) : (
          <Button label="شروعِ گفتگوی تصادفی" onPress={vm.join} />
        )}
        {vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold, textAlign: 'right', marginTop: spacing.sm },
  sub: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, textAlign: 'right', marginTop: spacing.xs },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  chipText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  chipTextActive: { color: colors.gold2 },
  body: { marginTop: spacing.xxl, gap: spacing.md },
  waiting: { alignItems: 'center', gap: spacing.lg },
  waitingText: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink2 },
  cancel: { minWidth: 160 },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, textAlign: 'center' },
});
