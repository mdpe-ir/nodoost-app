import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Stagger } from '@/presentation/components/Stagger';
import { PressableScale } from '@/presentation/components/PressableScale';
import { router, type Href } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { ActionSheet } from '@/presentation/components/ActionSheet';
import { useCases } from '@/core/di/DIProvider';
import { useChatViewModel } from '@/presentation/hooks/useChatViewModel';
import { useSupportEntry } from '@/presentation/hooks/useSupportEntry';
import { timeAgo } from '@/core/utils/time';
import { faNum } from '@/core/utils/faNum';
import type { Conversation } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

export function ChatScreen() {
  const vm = useChatViewModel();
  const uc = useCases();
  // منویِ نگه‌داشتنِ ردیف و دیالوگِ تأییدِ آن. پشتیبانی هیچ‌کدام را ندارد.
  const [rowMenu, setRowMenu] = useState<Conversation | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'clear' | 'block'; item: Conversation } | null>(
    null
  );
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
        <ScreenHeader title="گفتگو" membership />
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
    <PressableScale
      scaleTo={0.98}
      feedback="select"
      style={[styles.row, styles.supportRow]}
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
    </PressableScale>
  ) : null;

  return (
    <ScreenContainer>
      <ScreenHeader title="گفتگو" membership />
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
        renderItem={({ item, index }) => {
            const unread = !!item.unread;
            return (
              <Stagger index={index}>
              <PressableScale
                scaleTo={0.98}
                feedback="select"
                style={styles.row}
                accessibilityRole="button"
                accessibilityHint={item.isSupport ? undefined : 'نگه‌داشتن برای پاک‌کردن یا مسدود کردن'}
                // پشتیبانی مستثناست: نه پاک می‌شود نه بلاک — تنها راهِ کمک‌گرفتن است.
                onLongPress={item.isSupport ? undefined : () => setRowMenu(item)}
                delayLongPress={280}
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
                {/*
                  * آواتار عمداً قابلِ فشارِ جداگانه **نیست**: در فهرستِ گفتگو
                  * هر جای ردیف که بزنی باید گفتگو باز شود. پیش‌تر زدنِ آواتار
                  * به پروفایل می‌رفت و همین باعث می‌شد کاربری که فقط می‌خواست
                  * چت را باز کند، سر از صفحه‌ی دیگری دربیاورد. پروفایل از
                  * هدرِ خودِ گفتگو در دسترس است.
                  */}
                <Avatar uri={item.otherPhotoUrl} name={item.otherName} size={54} ring={unread} />
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
              </PressableScale>
              </Stagger>
            );
          }}
      />

      <ActionSheet
        visible={rowMenu != null}
        title={rowMenu?.otherName ?? 'گفتگو'}
        actions={
          rowMenu
            ? [
                {
                  key: 'clear',
                  label: 'پاک‌کردنِ گفتگو',
                  hint: 'فقط برای تو؛ او چیزی نمی‌بیند',
                  icon: 'close',
                  onPress: () => {
                    const target = rowMenu;
                    setRowMenu(null);
                    setConfirm({ kind: 'clear', item: target });
                  },
                },
                {
                  key: 'block',
                  label: 'مسدود کردن',
                  hint: 'دیگر نه پیامی، نه دیده‌شدنی',
                  icon: 'shield',
                  danger: true,
                  onPress: () => {
                    const target = rowMenu;
                    setRowMenu(null);
                    setConfirm({ kind: 'block', item: target });
                  },
                },
              ]
            : []
        }
        onDismiss={() => setRowMenu(null)}
      />

      <ActionSheet
        visible={confirm != null}
        title={
          confirm?.kind === 'block'
            ? `${confirm.item.otherName ?? 'این کاربر'} مسدود شود؟`
            : 'گفتگو پاک شود؟'
        }
        subtitle={
          confirm?.kind === 'block'
            ? 'دیگر نمی‌توانید به هم پیام بدهید یا هم را ببینید. دنبال‌کردن هم در هر دو جهت پاک می‌شود. هر وقت خواستی از تنظیمات ← حریمِ خصوصی برش می‌داری.'
            : 'تاریخچه فقط از سمتِ تو پاک می‌شود. اگر او پیامِ تازه‌ای بدهد، گفتگو با همان پیامِ جدید برمی‌گردد.'
        }
        actions={
          confirm
            ? [
                {
                  key: 'yes',
                  label: confirm.kind === 'block' ? 'بله، مسدود کن' : 'بله، پاک کن',
                  icon: confirm.kind === 'block' ? 'shield' : 'close',
                  danger: true,
                  onPress: () => {
                    const c = confirm;
                    setConfirm(null);
                    const run =
                      c.kind === 'block'
                        ? uc.safety.block(c.item.otherId)
                        : uc.chat.clearChat(c.item.matchId);
                    void run.then(() => vm.refresh());
                  },
                },
              ]
            : []
        }
        onDismiss={() => setConfirm(null)}
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
