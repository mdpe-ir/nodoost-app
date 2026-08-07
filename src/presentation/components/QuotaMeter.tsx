import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import {
  QUOTA_META,
  remainingText,
  remainingShort,
  resetText,
  scopeText,
  isExhausted,
  isLow,
} from '@/presentation/tiers/quotaCopy';
import type { Quota, QuotaItem } from '@/domain/entities';

/**
 * نوارِ سهمیه — «چقدر مانده» به‌شکلِ دیداری.
 *
 * قاعده‌ی رنگ عمدی است: طلایی = عادی، رز = تمام‌شده. زرد/نارنجیِ میانی نداریم
 * چون در پالتِ تیره‌ی برند از طلایی جدا دیده نمی‌شود؛ به‌جایش حالتِ «کم مانده»
 * با متن اعلام می‌شود، نه با رنگ.
 */
export function QuotaMeter({
  item,
  quota,
  compact,
}: {
  item: QuotaItem;
  quota: Quota | null;
  /** بدونِ عنوان و بدونِ خطِ تازه‌شدن — برای جاهای تنگ مثلِ کارتِ پروفایل. */
  compact?: boolean;
}) {
  const meta = QUOTA_META[item.key];
  const out = isExhausted(item);
  const low = isLow(item);
  const pct =
    item.unlimited || !item.limit ? 1 : Math.max(0, Math.min(1, (item.remaining ?? 0) / item.limit));
  const reset = resetText(item, quota);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headRight}>
          <Icon name={meta.icon} size={14} tint="gold" />
          <Text style={styles.label}>{meta.label}</Text>
        </View>
        <Text style={[styles.value, out && styles.valueOut]}>{remainingText(item)}</Text>
      </View>

      <View style={styles.track}>
        {/* راست‌به‌چپ: نوار از سمتِ راست پر می‌شود. */}
        <View
          style={[
            styles.fill,
            { width: `${Math.round(pct * 100)}%` },
            out && styles.fillOut,
            item.unlimited && styles.fillFull,
          ]}
        />
      </View>

      {!compact ? (
        <Text style={[styles.foot, out && styles.footOut]}>
          {out
            ? item.scope === 'lifetime'
              ? 'با ارتقای سطح دوباره باز می‌شود'
              : (reset ?? 'فردا تازه می‌شود')
            : low
              ? `${scopeText(item)} رو به پایان است${reset ? ` · ${reset}` : ''}`
              : (reset ?? scopeText(item))}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  head: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  headRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
  valueOut: { color: colors.rose },

  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
    flexDirection: 'row-reverse',
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.gold },
  fillFull: { backgroundColor: colors.gold2 },
  fillOut: { backgroundColor: colors.rose },

  foot: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footOut: { color: colors.rose },
});

/**
 * چیپِ فشرده‌ی هدر — عددِ باقی‌مانده با آیکن؛ در حالتِ تمام‌شده رزی می‌شود.
 * با onPress قابلِ فشار است تا از همان‌جا پنجره‌ی ارتقا باز شود.
 */
export function QuotaChip({ item, onPress }: { item: QuotaItem; onPress?: () => void }) {
  const meta = QUOTA_META[item.key];
  const out = isExhausted(item);
  const body = (
    <>
      <Icon name={meta.icon} size={13} tint="gold" />
      <Text style={[chip.text, out && chip.textOut]}>{remainingShort(item)}</Text>
    </>
  );
  const label = `${meta.label}: ${remainingText(item)}`;
  if (!onPress) {
    return (
      <View style={[chip.wrap, out && chip.wrapOut]} accessibilityLabel={label}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [chip.wrap, out && chip.wrapOut, pressed && chip.pressed]}
    >
      {body}
    </Pressable>
  );
}

const chip = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  wrapOut: { borderColor: colors.roseSoft, backgroundColor: colors.roseFaint },
  pressed: { opacity: 0.7 },
  text: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  textOut: { color: colors.rose },
});
