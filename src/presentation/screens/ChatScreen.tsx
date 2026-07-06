import React from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { useChatViewModel } from '@/presentation/hooks/useChatViewModel';
import { timeAgo } from '@/core/utils/time';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

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
          <EmptyState
            icon="tab-chat"
            title={vm.error ? 'اتصال برقرار نشد' : 'هنوز گفتگویی نداری'}
            hint={
              vm.error
                ? 'ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن.'
                : 'وقتی با کسی مَچ شوی، اینجا ظاهر می‌شود.'
            }
            actionLabel={vm.error ? 'تلاشِ دوباره' : undefined}
            onAction={vm.error ? vm.reload : undefined}
          />
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(c) => String(c.matchId)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.gold} />
          }
          renderItem={({ item }) => {
            const unread = !!item.unread;
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/thread/[id]',
                    params: {
                      id: String(item.matchId),
                      name: item.otherName ?? '',
                      peerId: String(item.otherId),
                    },
                  })
                }
              >
                {/* تپِ آواتار → پروفایلِ طرفِ مقابل.
                    بدونِ accessibilityRole تا روی وب <button> تودرتو نسازد. */}
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/user/[id]', params: { id: String(item.otherId) } })
                  }
                  hitSlop={4}
                  accessibilityLabel={`پروفایلِ ${item.otherName ?? 'کاربر'}`}
                >
                  <Avatar uri={item.otherPhotoUrl} name={item.otherName} size={54} ring={unread} />
                </Pressable>
                <View style={styles.meta}>
                  <View style={styles.rowTop}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.otherName ?? 'ناشناس'}
                      </Text>
                      {item.source === 'random' ? (
                        <View style={styles.sourceTag}>
                          <Text style={styles.sourceTagText}>تصادفی</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.lastAt ? <Text style={styles.time}>{timeAgo(item.lastAt)}</Text> : null}
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                      {item.lastBody ?? 'گفتگو را شروع کن…'}
                    </Text>
                    {unread ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{faNum(item.unread!)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
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
  rowPressed: { opacity: 0.7 },
  meta: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nameWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sourceTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.roseFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,111,128,0.35)',
  },
  sourceTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.rose },
  time: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
  rowBottom: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  preview: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
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
