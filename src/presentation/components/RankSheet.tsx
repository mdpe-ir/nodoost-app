import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { router, type Href } from 'expo-router';

import { Button } from './Button';
import { RankBadge } from './RankBadge';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';
import type { Rank } from '@/domain/entities';


/**
 * توضیحِ نشانِ رتبه — همان چیزی که با زدن روی نشان باز می‌شود.
 *
 * دو حالت دارد: نشانِ خودم (با عدد و «تا رتبه‌ی بعدی چقدر مانده») و نشانِ یک
 * کاربرِ دیگر (بدونِ عدد + دعوت به صفحه‌ی ماموریت‌ها). دومی همان جایی است که
 * چرخه‌ی ویروسی بسته می‌شود: «او با انجامِ ماموریت این را گرفته، تو هم می‌توانی».
 */
export function RankSheet({
  visible,
  rank,
  peerName,
  earned,
  nextRank,
  toNext,
  onDismiss,
}: {
  visible: boolean;
  rank?: Rank | null;
  /** نامِ کاربرِ دیگر — اگر بیاید یعنی نشانِ او را می‌بینیم، نه خودمان. */
  peerName?: string;
  earned?: number;
  nextRank?: Rank | null;
  toNext?: number;
  onDismiss: () => void;
}) {

  const mine = !peerName;

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>

          <View style={styles.badgeRow}>
            <RankBadge rank={rank} height={30} />
          </View>

          <Text style={styles.title}>
            {mine ? 'رتبه‌ی تو' : `رتبه‌ی ${peerName}`}
          </Text>

          <Text style={styles.body}>
            {mine
              ? 'رتبه از مجموعِ امتیازی می‌آید که تا امروز کسب کرده‌ای. خرج‌کردنِ امتیاز برای گرفتنِ جایزه، رتبه‌ات را پایین نمی‌آورد.'
              : 'این کاربر با انجامِ ماموریت‌های نودوست این رتبه را گرفته است. تو هم می‌توانی.'}
          </Text>

          {mine && earned !== undefined ? (
            <View style={styles.stats}>
              <Text style={styles.statLine}>
                امتیازِ کسب‌شده: <Text style={styles.statValue}>{faNum(earned)}</Text>
              </Text>
              {nextRank && toNext ? (
                <Text style={styles.statLine}>
                  <Text style={styles.statValue}>{faNum(toNext)}</Text> امتیاز تا «{nextRank.name}»
                </Text>
              ) : (
                <Text style={styles.statLine}>به بالاترین رتبه رسیده‌ای 🎉</Text>
              )}
            </View>
          ) : null}

          <Button
            label={mine ? 'ماموریت‌های من' : 'من هم می‌خواهم'}
            icon="star"
            onPress={() => {
              onDismiss();
              router.push('/arena' as Href);
            }}
            style={{ marginTop: spacing.lg }}
          />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row-reverse', marginBottom: spacing.md },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  stats: {
    marginTop: spacing.lg,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  statLine: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statValue: { fontFamily: fonts.bold, color: colors.gold2 },
});
