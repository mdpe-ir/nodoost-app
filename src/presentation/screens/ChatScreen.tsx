import React from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { useChatViewModel } from '@/presentation/hooks/useChatViewModel';
import { useSupportEntry } from '@/presentation/hooks/useSupportEntry';
import { timeAgo } from '@/core/utils/time';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

export function ChatScreen() {
  const vm = useChatViewModel();
  const support = useSupportEntry();

  // گفتگوی پشتیبانی از فهرستِ عادی جدا می‌شود تا به‌عنوان ردیفِ سنجاق‌شده بالای
  // فهرست بنشیند و با صفحه‌بندی پایین نرود. سرور هم همین را اول برمی‌گرداند،
  // ولی به ترتیبِ سرور تکیه نمی‌کنیم.
  const supportConv = vm.items.find((c) => c.isSupport);
  const conversations = vm.items.filter((c) => !c.isSupport);

  // شمارنده‌ی خوانده‌نشده‌ی گفتگوی موجود دقیق‌تر از خلاصه‌ی /api/support است.
  const supportUnread = supportConv?.unread ?? support.unread;

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="گفتگو" />
        <RowsSkeleton count={7} />
      </ScreenContainer>
    );
  }

  /**
   * ردیفِ حسابِ رسمی — همیشه بالای فهرست، حتی وقتی کاربر هیچ گفتگویی ندارد
   * (که دقیقاً همان لحظه‌ای است که بیشتر به پشتیبانی نیاز دارد).
   * به /support می‌رود، نه /thread: صفحه‌ی پشتیبانی مسدود/نیمه‌ثبت‌نام را هم
   * راه می‌دهد و منوی مسدودکردن/گزارش را روی حسابِ رسمی نشان نمی‌دهد.
   */
  const supportRow = support.enabled ? (
    <Pressable
      style={({ pressed }) => [styles.row, styles.supportRow, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel="گفتگو با پشتیبانی"
      onPress={() => router.push('/support' as Href)}
    >
      <Avatar
        uri={support.account?.photoUrl}
        name={support.account?.name ?? 'پشتیبانی'}
        size={54}
        ring={supportUnread > 0}
      />
      <View style={styles.meta}>
        <View style={styles.rowTop}>
          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {support.account?.name ?? 'پشتیبانیِ نودوست'}
            </Text>
            {/* نشانِ تأیید — همان گلیفِ چهره‌نمای اپ؛ یعنی این حساب واقعاً ماییم. */}
            <Icon name="shield-check" size={16} tint="gold" />
            <View style={styles.officialTag}>
              <Text style={styles.officialTagText}>رسمی</Text>
            </View>
          </View>
          {supportConv?.lastAt ? (
            <Text style={styles.time}>{timeAgo(supportConv.lastAt)}</Text>
          ) : null}
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, supportUnread > 0 && styles.previewUnread]}
            numberOfLines={1}
          >
            {supportConv?.lastBody ?? 'سوال یا مشکلی داری؟ بنویس برایمان.'}
          </Text>
          {supportUnread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{faNum(supportUnread)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  ) : null;

  return (
    <ScreenContainer>
      <ScreenHeader title="گفتگو" />
      {/*
       * فهرست همیشه رندر می‌شود (حتی خالی) تا ردیفِ سنجاق‌شده‌ی پشتیبانی در
       * حالتِ «هنوز گفتگویی نداری» ناپدید نشود.
       */}
      <FlatList
        data={conversations}
        keyExtractor={(c) => String(c.matchId)}
        showsVerticalScrollIndicator={false}
        onEndReached={vm.loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={supportRow}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
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
        }
        ListFooterComponent={
          vm.loadingMore && vm.hasMore ? <RowsSkeleton count={3} /> : null
        }
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
                      photoUrl: item.otherPhotoUrl ?? '',
                      peerTier: String(item.otherTier ?? ''),
                      initiatedBy: String(item.initiatedBy ?? ''),
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
                      {item.otherTier ? <TierBadge tier={item.otherTier} height={18} /> : null}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // با ListEmptyComponent دیگر ظرفِ flex:1 نداریم؛ ارتفاعِ ثابت جای خالی را پر
  // می‌کند تا حالتِ خالی زیرِ ردیفِ پشتیبانی معلق نماند.
  emptyWrap: { paddingTop: spacing.xxl },
  // ردیفِ رسمی: ته‌رنگِ طلاییِ کم‌جان تا در یک نگاه از گفتگوهای عادی جدا شود.
  supportRow: {
    backgroundColor: colors.goldFaint,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  officialTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  officialTagText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
    color: colors.onGold,
  },
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
