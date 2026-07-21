import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts } from '@/core/theme';

/** سقفِ نمایش؛ بیشتر از این «۹+» می‌شود. */
const MAX = 9;

interface Props {
  count: number;
  style?: ViewStyle;
}

/**
 * نشانِ عددیِ کوچک (روی زنگوله و تبِ گفتگو). با صفر چیزی نشان نمی‌دهد و
 * بیش از ۹ به «۹+» با ارقامِ فارسی خلاصه می‌شود.
 */
export function CountBadge({ count, style }: Props) {
  if (!count || count <= 0) return null;
  const label = count > MAX ? `${faNum(MAX)}+` : faNum(count);
  return (
    <View
      style={[styles.badge, style]}
      accessibilityLabel={`${label} مورد خوانده‌نشده`}
      pointerEvents="none"
    >
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    // در RTL نشان روی گوشه‌ی چپِ آیکن می‌نشیند.
    left: -6,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.rose,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    lineHeight: 13,
    color: colors.onPhoto,
    textAlign: 'center',
  },
});
