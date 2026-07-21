import React from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { FollowButton } from '@/presentation/components/FollowButton';
import { useFollowListViewModel } from '@/presentation/hooks/useFollowListViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { faNum } from '@/core/utils/faNum';
import type { FollowListKind, FollowUser } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

const TABS: { key: FollowListKind; label: string }[] = [
  { key: 'followers', label: 'دنبال‌کننده‌ها' },
  { key: 'following', label: 'دنبال‌شده‌ها' },
];

function FollowRow({
  item,
  isMe,
  busy,
  onToggle,
}: {
  item: FollowUser;
  isMe: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(item.id) } })}
      accessibilityRole="button"
      accessibilityLabel={item.name ?? 'پروفایل'}
    >
      <Avatar uri={item.photoUrl} name={item.name} size={48} />
      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name ?? 'بی‌نام'}
            {item.age ? `، ${faNum(item.age)}` : ''}
          </Text>
          {item.verified ? <Icon name="shield-check" size={14} tint="gold" /> : null}
          {item.tier ? <TierBadge tier={item.tier} height={15} /> : null}
        </View>
      </View>
      {/* دنبال‌کردن رایگان است — روی خودم دکمه‌ای نشان نمی‌دهیم. */}
      {isMe ? null : (
        <FollowButton isFollowing={item.isFollowing} busy={busy} onPress={onToggle} size="sm" />
      )}
    </Pressable>
  );
}

/**
 * فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌ها در یک صفحه با سوییچِ بخش‌بخش.
 * `userId` تهی یعنی فهرستِ خودم.
 */
export function FollowersScreen({
  userId,
  initialTab = 'followers',
  peerName,
}: {
  userId?: number;
  initialTab?: FollowListKind;
  peerName?: string;
}) {
  const vm = useFollowListViewModel(userId, initialTab);
  const { user } = useSession();
  const myId = user?.id;

  const title = peerName ? `دنبال‌کننده‌های ${peerName}` : 'دنبال‌کننده‌ها';

  return (
    <ScreenContainer>
      <StackHeader title={title} />
      <SegmentedControl options={TABS} value={vm.tab} onChange={vm.setTab} />

      {vm.loading ? (
        <RowsSkeleton count={8} />
      ) : vm.error && vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <FollowRow
              item={item}
              isMe={item.id === myId}
              busy={vm.isBusy(item.id)}
              onToggle={() => vm.toggleFollow(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={vm.loadMore}
          refreshControl={
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <EmptyState
                icon="tab-profile"
                title={vm.tab === 'followers' ? 'هنوز دنبال‌کننده‌ای نیست' : 'هنوز کسی را دنبال نکرده'}
                hint={
                  vm.tab === 'followers'
                    ? 'با فعال‌بودن در کاوش و اطراف، زودتر دیده می‌شوی.'
                    : 'هرکس را دنبال کنی، این‌جا فهرست می‌شود.'
                }
              />
            </View>
          }
          ListFooterComponent={
            vm.loadingMore ? <ActivityIndicator color={colors.gold} style={styles.footer} /> : null
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.md, flexGrow: 1 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  rowBody: { flex: 1 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  name: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: { paddingVertical: spacing.lg },
});
