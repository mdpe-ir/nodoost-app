import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/core/theme';

interface Props {
  children: React.ReactNode;
  /** اگر true باشد padding افقیِ پیش‌فرض اعمال نمی‌شود (برای فهرست‌های تمام‌عرض). */
  flush?: boolean;
  style?: ViewStyle;
}

/** قابِ پایه‌ی صفحه: پس‌زمینه‌ی تیره + رعایتِ ناحیه‌ی امن. */
export function ScreenContainer({ children, flush, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + spacing.sm },
        !flush && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: 18 },
});
