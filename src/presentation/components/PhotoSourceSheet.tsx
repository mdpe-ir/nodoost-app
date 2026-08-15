import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** سرچشمه‌ی عکس — دوربین یا گالری. */
export type PhotoSource = 'camera' | 'library';

/** فاصله‌ی سُرخوردنِ برگه از پایینِ صفحه؛ از بلندترین حالتِ برگه بیشتر است. */

interface Props {
  visible: boolean;
  onSelect: (source: PhotoSource) => void;
  onDismiss: () => void;
}

/**
 * برگه‌ی انتخابِ سرچشمه‌ی عکس (bottom sheet).
 *
 * تا پیش از این هر دو مسیرِ عکس یک‌راست گالری را باز می‌کردند و دوربین اصلاً
 * استفاده نمی‌شد — در حالی که مجوزِ CAMERA از دلِ کتابخانه‌ی پیکر واردِ APK می‌شد.
 * کافه‌بازار درست ایراد گرفت: مجوزی که اعلام می‌شود باید واقعاً به کار برود.
 */
export function PhotoSourceSheet({ visible, onSelect, onDismiss }: Props) {
  // (محتوا با بسته‌شدن از درخت می‌رود و انیمیشنِ برگشتِ ریانیمیتد فرصت اجرا ندارد).

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
          <Text style={styles.title}>عکست را از کجا برداریم؟</Text>
          <Text style={styles.sub}>یک عکسِ واضح از چهره‌ات بهترین نتیجه را می‌دهد.</Text>

          <View style={styles.options}>
            <SourceRow
              glyph="camera"
              label="دوربین"
              hint="همین حالا یک عکسِ تازه بگیر"
              onPress={() => onSelect('camera')}
            />
            <SourceRow
              glyph="library"
              label="گالری"
              hint="از عکس‌های ذخیره‌شده انتخاب کن"
              onPress={() => onSelect('library')}
            />
          </View>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
            accessibilityRole="button"
            accessibilityLabel="انصراف از انتخابِ عکس"
          >
            <Text style={styles.cancelText}>انصراف</Text>
          </Pressable>
    </BottomSheet>
  );
}

/** یک ردیفِ انتخاب — هدفِ لمسِ ۶۴ پیکسلی و چیدمانِ راست‌به‌چپ. */
function SourceRow({
  glyph,
  label,
  hint,
  onPress,
}: {
  glyph: 'camera' | 'library';
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.glyphBox}>{glyph === 'camera' ? <CameraGlyph /> : <LibraryGlyph />}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {/* در راست‌به‌چپ، «بعدی» به سمتِ چپ اشاره می‌کند. */}
      <Icon name="chevron-prev" size={16} tint="gold" style={styles.rowChevron} />
    </Pressable>
  );
}

/*
 * ستِ آیکنِ برند دوربین/گالری ندارد و افزودنِ یک کتابخانه‌ی آیکنِ تازه، زبانِ بصری
 * را دوپاره می‌کرد. این دو نشانه با چند View کشیده شده‌اند — هم‌رنگِ طلاییِ برند
 * و بدونِ وابستگیِ جدید.
 */
function CameraGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={styles.camHump} />
      <View style={styles.camBody}>
        <View style={styles.camLens} />
      </View>
    </View>
  );
}

function LibraryGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={styles.libBody}>
        <View style={styles.libSun} />
        <View style={styles.libPeak} />
      </View>
    </View>
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
  sub: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  options: { marginTop: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
  },
  rowPressed: { opacity: 0.85, borderColor: colors.goldSoft },
  glyphBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowChevron: { opacity: 0.7 },

  cancel: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  cancelPressed: { opacity: 0.7 },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    writingDirection: 'rtl',
  },

  // — نشانه‌های ترسیمی —
  glyph: { width: 26, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  camHump: {
    width: 11,
    height: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.gold,
    marginBottom: -1,
    marginRight: 6,
  },
  camBody: {
    width: 26,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.6,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camLens: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.6,
    borderColor: colors.gold,
  },
  libBody: {
    width: 26,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.6,
    borderColor: colors.gold,
    overflow: 'hidden',
  },
  libSun: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  libPeak: {
    position: 'absolute',
    bottom: -1,
    left: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.gold,
  },
});
