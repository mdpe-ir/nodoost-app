import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from './Button';
import { RankBadge } from './RankBadge';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';
import type { Rank } from '@/domain/entities';

const TRAVEL = 460;
const ENTER_SPRING = { damping: 20, stiffness: 190, mass: 0.9 } as const;

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
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) progress.value = withSpring(1, ENTER_SPRING);
    else progress.value = 0;
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * TRAVEL }],
  }));

  const mine = !peerName;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="بستن" />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}
        >
          <View style={styles.grabber} />

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
              router.push('/missions');
            }}
            style={{ marginTop: spacing.lg }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.lg,
  },
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
