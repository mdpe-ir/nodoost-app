import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radius } from '@/core/theme';

interface Option<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
}

/** سوییچِ بخش‌بخش — راست‌به‌چپ؛ گزینه‌ی اول سمتِ راست. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.seg, active && styles.segActive, pressed && !active && styles.segPressed]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    padding: 3,
  },
  seg: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segActive: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  segPressed: { opacity: 0.7 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink3 },
  labelActive: { color: colors.gold2 },
});
