import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { SegmentedControl } from './SegmentedControl';
import { EmptyState } from './EmptyState';
import { RowsSkeleton } from './Skeleton';
import { Icon } from './Icon';
import { useLeaderboardViewModel } from '@/presentation/hooks/useLeaderboardViewModel';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import type { LeaderEntry, LeaderWindow } from '@/domain/entities';

const WINDOWS: { key: LeaderWindow; label: string }[] = [
  { key: 'daily', label: 'روزانه' },
  { key: 'weekly', label: 'هفتگی' },
  { key: 'monthly', label: 'ماهانه' },
  { key: 'all', label: 'کلی' },
];

/** مدالِ سه نفرِ اول. رتبه‌ی چهارم به بعد فقط شماره می‌گیرد. */
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/**
 * جدولِ رتبه‌بندی با چهار بازه‌ی تقویمی.
 *
 * دو چیز همیشه باید معلوم باشد: صدرِ جدول، و «من کجایم». ردیفِ خودِ کاربر
 * جداگانه و چسبیده پایین می‌ماند، چون کاربر معمولاً در صد نفرِ اول نیست و
 * جدولی که فقط قهرمان‌ها را نشان بدهد برای بقیه بی‌معناست.
 */
export function LeaderboardPanel() {
  const vm = useLeaderboardViewModel();

  return (
    <View style={styles.root}>
      <SegmentedControl options={WINDOWS} value={vm.window} onChange={vm.setWindow} />

      {vm.board?.label ? (
        <Text style={styles.caption}>
          {vm.board.label}
          {vm.board.total > 0 ? ` — ${faNum(vm.board.total)} نفر در رقابت‌اند` : ''}
        </Text>
      ) : null}

      {vm.loading ? (
        <RowsSkeleton />
      ) : vm.error ? (
        <EmptyState
          icon="rewind"
          title="بارگذاری نشد"
          hint="اتصالت را بررسی کن."
          actionLabel="تلاشِ دوباره"
          onAction={vm.reload}
        />
      ) : !vm.board?.entries.length ? (
        <EmptyState
          icon="star"
          title="هنوز کسی در این بازه امتیازی نگرفته"
          hint="اولین نفر باش — یک ماموریت انجام بده."
        />
      ) : (
        <>
          {vm.board.entries.map((e, i) => (
            <Row key={e.userId} entry={e} index={i} />
          ))}

          {/* اگر خودم در فهرست نیستم، جایگاهم را جداگانه می‌گویم. */}
          {!vm.board.me.inTop ? (
            <View style={styles.myBox}>
              <Text style={styles.myLabel}>جایگاهِ تو</Text>
              {vm.board.me.rank > 0 ? (
                <Text style={styles.myValue}>
                  رتبه‌ی {faNum(vm.board.me.rank)} با {faNum(vm.board.me.points)} امتیاز
                </Text>
              ) : (
                <Text style={styles.myValue}>
                  در این بازه هنوز امتیازی نگرفته‌ای — با یک ماموریت وارد جدول شو.
                </Text>
              )}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function Row({ entry, index }: { entry: LeaderEntry; index: number }) {
  const medal = MEDAL[entry.rank];

  return (
    <Animated.View entering={FadeInDown.duration(200).delay(Math.min(index, 8) * 20)}>
      <Pressable
        // ردیفِ خودم به پروفایلِ خودم نمی‌رود؛ /user/{me} صفحه‌ی غریبه است.
        onPress={
          entry.isMe ? undefined : () => router.push(`/user/${entry.userId}` as Href)
        }
        disabled={entry.isMe}
        accessibilityRole={entry.isMe ? undefined : 'button'}
        style={({ pressed }) => [
          styles.row,
          entry.isMe && styles.rowMe,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={styles.rankSlot}>
          {medal ? (
            <Text style={styles.medal}>{medal}</Text>
          ) : (
            <Text style={styles.rankNum}>{faNum(entry.rank)}</Text>
          )}
        </View>

        {entry.photoUrl ? (
          <Image source={{ uri: entry.photoUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Icon name="tab-profile" size={16} tint="ink" />
          </View>
        )}

        <Text style={[styles.name, entry.isMe && styles.nameMe]} numberOfLines={1}>
          {entry.name || 'بی‌نام'}
          {entry.isMe ? ' (تو)' : ''}
        </Text>

        <Text style={styles.points}>{faNum(entry.points)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const AVATAR = 36;

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  caption: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  rowMe: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  rowPressed: { opacity: 0.7 },

  rankSlot: { width: 28, alignItems: 'center' },
  medal: { fontSize: 18 },
  rankNum: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.ink3 },

  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: colors.bg },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },

  name: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nameMe: { fontFamily: fonts.bold, color: colors.gold2 },

  points: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.gold },

  myBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    gap: spacing.xs,
  },
  myLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  myValue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
