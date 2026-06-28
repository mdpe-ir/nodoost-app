import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Loading } from '@/presentation/components/Loading';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { useChatViewModel } from '@/presentation/hooks/useChatViewModel';
import { timeAgo } from '@/core/utils/time';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

export function ChatScreen() {
  const vm = useChatViewModel();

  if (vm.loading) return <Loading />;

  return (
    <ScreenContainer>
      <Text style={styles.title}>گفتگو</Text>
      {vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState icon="💬" title="هنوز گفتگویی نداری" hint="وقتی با کسی مَچ شوی، اینجا ظاهر می‌شود." />
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(c) => String(c.matchId)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: '/thread/[id]',
                  params: { id: String(item.matchId), name: item.otherName ?? '' },
                })
              }
            >
              <Avatar name={item.otherName} size={52} />
              <View style={styles.meta}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.otherName ?? 'ناشناس'}
                  </Text>
                  {item.lastAt ? <Text style={styles.time}>{timeAgo(item.lastAt)}</Text> : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastBody ?? 'گفتگو را شروع کن…'}
                </Text>
              </View>
              {item.unread ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{faNum(item.unread)}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold, textAlign: 'right', marginVertical: spacing.sm },
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
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.onGold },
});
