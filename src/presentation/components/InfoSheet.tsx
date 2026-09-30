import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

/** یک سطرِ فقط‌خواندنی — برچسبِ راست، مقدارِ چپ. */
export interface InfoRow {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  title: string;
  rows: InfoRow[];
  onDismiss: () => void;
}

/**
 * برگه‌ی «اطلاعات» — سطرهای فقط‌خواندنیِ کلید/مقدار.
 *
 * چرا از `ActionSheet` استفاده نشد: آن برگه هر ردیفش یک کنشِ ضربه‌ای است.
 * اطلاعاتِ یک پیام (زمانِ ارسال، ویرایش، خوانده‌شدن) کنش نیستند و اگر به شکلِ
 * دکمه نشان داده شوند، کاربر به‌دنبال نتیجه‌ای می‌گردد که وجود ندارد.
 */
export function InfoSheet({ visible, title, rows, onDismiss }: Props) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rows}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value} numberOfLines={2}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rows: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  value: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
});
