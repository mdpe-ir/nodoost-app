import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { useChatViewModel } from '@/presentation/hooks/useChatViewModel';
import { timeAgo } from '@/core/utils/time';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

export function ChatScreen() {
  const vm = useChatViewModel();

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="گفتگو" />
        <RowsSkeleton count={7} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="گفتگو" />
      {vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState icon="tab-chat" title="هنوز گفتگویی نداری" hint="وقتی با کسی مَچ شوی، اینجا ظاهر می‌شود." />
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(c) => String(c.matchId)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const unread = !!item.unread;
            return (
              <Pressable
                style={styles.row}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/thread/[id]',
                    params: { id: String(item.matchId), name: item.otherName ?? '' },
                  })
                }
              >
                <Avatar name={item.otherName} size={52} ring={unread} />
                <View style={styles.meta}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.otherName ?? 'ناشناس'}
                    </Text>
                    {item.lastAt ? <Text style={styles.time}>{timeAgo(item.lastAt)}</Text> : null}
                  </View>
                  <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                    {item.lastBody ?? 'گفتگو را شروع کن…'}
                  </Text>
                </View>
                {unread ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{faNum(item.unread!)}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  meta: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink, textAlign: 'right', flex: 1 },
  time: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, marginLeft: spacing.sm },
  preview: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, textAlign: 'right' },
  previewUnread: { color: colors.ink2, fontFamily: fonts.medium },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.onGold },
});
