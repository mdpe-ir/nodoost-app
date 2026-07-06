import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts, fontSizes, lineHeights, type ColorKey } from '@/core/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodySm' | 'caption' | 'label';

/**
 * متنِ استاندارد اپ — فارسی و راست‌چین به‌صورتِ پیش‌فرض.
 * writingDirection را همیشه rtl می‌گذارد تا متنِ ترکیبی (فارسی + عدد/لاتین)
 * و سه‌نقطه‌ی numberOfLines سمتِ درست بیفتد.
 */
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, lineHeight: lineHeights.xxl },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, lineHeight: lineHeights.xl },
  heading: { fontFamily: fonts.bold, fontSize: fontSizes.lg, lineHeight: lineHeights.lg },
  body: { fontFamily: fonts.regular, fontSize: fontSizes.md, lineHeight: lineHeights.md },
  bodySm: { fontFamily: fonts.regular, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  caption: { fontFamily: fonts.regular, fontSize: fontSizes.xs, lineHeight: lineHeights.xs },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
};

const WEIGHTS = {
  regular: fonts.regular,
  medium: fonts.medium,
  bold: fonts.bold,
} as const;

interface Props extends TextProps {
  variant?: Variant;
  /** کلیدِ رنگ از پالت یا مقدارِ خام (برای متن روی عکس و…). */
  color?: ColorKey | (string & {});
  align?: TextStyle['textAlign'];
  /** وزنِ فونت را جدا از واریانت عوض می‌کند. */
  weight?: keyof typeof WEIGHTS;
}

export function AppText({
  variant = 'body',
  color = 'ink',
  align = 'right',
  weight,
  style,
  children,
  ...rest
}: Props) {
  const resolved = color in colors ? colors[color as ColorKey] : (color as string);
  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        { color: resolved, textAlign: align, writingDirection: 'rtl' },
        weight ? { fontFamily: WEIGHTS[weight] } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
