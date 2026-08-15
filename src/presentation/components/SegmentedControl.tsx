import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
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
          <PressableScale
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            scaleTo={0.94}
            feedback="select"
            style={[styles.seg, active && styles.segActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </PressableScale>
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
    borderTopColor: colors.rim,
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
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink3 },
  labelActive: { color: colors.gold2 },
});
