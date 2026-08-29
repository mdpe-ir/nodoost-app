import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { EmptyState } from './EmptyState';
import { RowsSkeleton } from './Skeleton';
import { Icon } from './Icon';
import { useLeaderboardViewModel } from '@/presentation/hooks/useLeaderboardViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, radius, spacing } from '@/core/theme';
import type { LeaderEntry } from '@/domain/entities';

/** مدالِ سه نفرِ اول. رتبه‌ی چهارم به بعد فقط شماره می‌گیرد. */
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/**
 * جدولِ رتبه‌بندیِ کلی (از ابتدا).
 *
 * پنجاه نفرِ اول نشان داده می‌شود. اگر کاربر در این فهرست نباشد ولی رتبه‌ی
 * کلی داشته باشد، ردیفِ خودش پایینِ جدول می‌آید — نه در جعبه‌ی جداگانه.
 */
export function LeaderboardPanel() {
  const vm = useLeaderboardViewModel('all');
  const { user } = useSession();

  const myRow = useMemo((): LeaderEntry | null => {
    const me = vm.board?.me;
    if (!me || me.inTop || me.rank <= 0 || !user) return null;
    const photoUrl =
      user.photos?.find((p) => p.isPrimary)?.url ?? user.photos?.[0]?.url;
    return {
      rank: me.rank,
      userId: user.id,
      name: user.name ?? '',
      photoUrl,
      points: me.points,
      isMe: true,
    };
  }, [vm.board?.me, user]);

  return (
    <View style={styles.root}>
      {vm.board?.total ? (
        <Text style={styles.caption}>{faNum(vm.board.total)} نفر در رقابت‌اند</Text>
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
      ) : !vm.board?.entries.length && !myRow ? (
        <EmptyState
          icon="star"
          title="هنوز کسی امتیازی نگرفته"
          hint="اولین نفر باش — یک ماموریت انجام بده."
        />
      ) : (
        <>
          {vm.board?.entries.map((e, i) => (
            <Row key={e.userId} entry={e} index={i} />
          ))}

          {myRow ? (
            <>
              <View style={styles.gap}>
                <View style={styles.gapLine} />
                <Text style={styles.gapDots}>···</Text>
                <View style={styles.gapLine} />
              </View>
              <Row entry={myRow} index={vm.board?.entries.length ?? 0} />
            </>
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
      <PressableScale
        // ردیفِ خودم به پروفایلِ خودم نمی‌رود؛ /user/{me} صفحه‌ی غریبه است.
        onPress={
          entry.isMe ? undefined : () => router.push(`/user/${entry.userId}` as Href)
        }
        disabled={entry.isMe}
        accessibilityRole={entry.isMe ? undefined : 'button'}
        scaleTo={0.985}
        style={[styles.row, entry.isMe && styles.rowMe]}
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
      </PressableScale>
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
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  rowMe: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },

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

  gap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  gapLine: { flex: 1, height: 1, backgroundColor: colors.line },
  gapDots: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.ink3 },
});
