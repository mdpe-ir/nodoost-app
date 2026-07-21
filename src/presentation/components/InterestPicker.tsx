import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip } from '@/presentation/components/Chip';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';
import { MAX_INTERESTS, type InterestItem } from '@/core/config/interestsCatalog';

interface Props {
  options: InterestItem[];
  value: string[]; // برچسب‌های انتخاب‌شده (همان چیزی که به PATCH /me می‌رود)
  onChange: (next: string[]) => void;
  max?: number;
}

/**
 * انتخاب‌گرِ چندگانه‌ی علاقه‌مندی‌ها — چیپ‌های wrap شده، با سقفِ انتخاب و شمارنده.
 * در ثبت‌نام و ویرایشِ پروفایل مشترک است.
 */
export function InterestPicker({ options, value, onChange, max = MAX_INTERESTS }: Props) {
  const atMax = value.length >= max;

  function toggle(label: string) {
    if (value.includes(label)) {
      onChange(value.filter((l) => l !== label));
    } else if (!atMax) {
      onChange([...value, label]);
    }
  }

  return (
    <View>
      <View style={styles.grid}>
        {options.map((it) => (
          <Chip
            key={it.slug}
            label={it.label}
            active={value.includes(it.label)}
            onPress={() => toggle(it.label)}
            style={styles.chip}
          />
        ))}
      </View>
      <Text style={[styles.counter, atMax && styles.counterMax]}>
        {faNum(value.length)} / {faNum(max)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: { minHeight: 42, paddingHorizontal: 14 },
  counter: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'left',
    marginTop: spacing.sm,
  },
  counterMax: { color: colors.gold2 },
});
