import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Icon } from '@/presentation/components/Icon';
import { Avatar } from '@/presentation/components/Avatar';
import { useNotificationsViewModel } from '@/presentation/hooks/useNotificationsViewModel';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import { toAppPath } from '@/core/utils/deepLink';
import { faNum } from '@/core/utils/faNum';
import { timeAgo } from '@/core/utils/time';
import type { AppNotification, NotificationKind } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** آیکنِ کوچکِ گوشه‌ی آواتار برای هر گونه‌ی اعلان. */
const KIND_ICONS: Record<NotificationKind, React.ComponentProps<typeof Icon>['name']> = {
  follow: 'plus',
  like: 'heart-fill',
  super_like: 'star',
  match: 'heart-fill',
  message: 'tab-chat',
  profile_view: 'tab-profile',
  system: 'shield',
};

type Bucket = 'today' | 'week' | 'older';
const BUCKET_TITLES: Record<Bucket, string> = {
  today: 'امروز',
  week: 'این هفته',
  older: 'قدیمی‌تر',
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** اعلان را بر پایه‌ی `updatedAt` در یکی از سه بازه می‌گذارد. */
function bucketOf(iso?: string): Bucket {
  if (!iso) return 'older';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'older';
  const today = startOfDay(new Date());
  if (t >= today) return 'today';
  if (t >= today - 6 * 86_400_000) return 'week';
  return 'older';
}

/** آواتارهای روی‌هم؛ در حالتِ قفل، دایره‌های خاکستری با نشانِ قفل. */
function ActorStack({ n }: { n: AppNotification }) {
  if (n.locked) {
    return (
      <View style={styles.stack}>
        <View style={[styles.lockedAvatar, styles.stackItem]}>
          <Icon name="lock" size={16} tint="gold" />
        </View>
        {n.count > 1 ? <View style={[styles.lockedAvatar, styles.stackBehind]} /> : null}
      </View>
    );
  }
  const shown = n.actors.slice(0, 3);
  if (shown.length === 0) {
    return (
      <View style={styles.stack}>
        <View style={[styles.systemAvatar, styles.stackItem]}>
          <Icon name={KIND_ICONS[n.kind]} size={18} tint="gold" />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.stack}>
      {shown.map((a, i) => (
        <View
          key={a.id}
          // نفرِ اول جلوتر می‌نشیند؛ بقیه با جابه‌جاییِ کوچک پشتِ آن.
          style={[styles.stackItem, i > 0 && { marginRight: -18 - i * 2, zIndex: -i }]}
        >
          <Avatar uri={a.photoUrl} name={a.name} size={i === 0 ? 46 : 38} ring={i === 0} />
        </View>
      ))}
    </View>
  );
}

function NotificationCard({
  n,
  onPress,
}: {
  n: AppNotification;
  onPress: (n: AppNotification) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(n)}
      accessibilityRole="button"
      accessibilityLabel={n.title || n.body}
      style={({ pressed }) => [styles.card, !n.read && styles.cardUnread, pressed && styles.pressed]}
    >
      <View style={styles.avatarWrap}>
        <ActorStack n={n} />
        <View style={styles.kindChip}>
          <Icon name={KIND_ICONS[n.kind]} size={11} tint="ink" />
        </View>
      </View>

      <View style={styles.body}>
        {/* متنِ فارسی را سرور آماده می‌فرستد — این‌جا فقط نمایش داده می‌شود. */}
        {n.title ? (
          <Text style={styles.title} numberOfLines={1}>
            {n.title}
          </Text>
        ) : null}
        <Text style={styles.text} numberOfLines={2}>
          {n.body}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{timeAgo(n.updatedAt)}</Text>
          {n.count > 1 ? <Text style={styles.count}>{`${faNum(n.count)} مورد`}</Text> : null}
          {n.locked ? (
            <View style={styles.lockTag}>
              <Icon name="lock" size={10} tint="gold" />
              <Text style={styles.lockTagText}>برای دیدن، ارتقا بده</Text>
            </View>
          ) : null}
        </View>
      </View>

      {!n.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

/** فهرستِ اعلان‌ها — گروه‌بندی‌شده بر پایه‌ی زمان، با تازه‌سازیِ کششی و بارگذاریِ پیوسته. */
export function NotificationsScreen() {
  const vm = useNotificationsViewModel();
  useRefetchOnFocus(vm.refresh);

  const sections = useMemo(() => {
    const groups: Record<Bucket, AppNotification[]> = { today: [], week: [], older: [] };
    vm.items.forEach((n) => groups[bucketOf(n.updatedAt)].push(n));
    return (['today', 'week', 'older'] as Bucket[])
      .filter((b) => groups[b].length > 0)
      .map((b) => ({ title: BUCKET_TITLES[b], data: groups[b] }));
  }, [vm.items]);

  const openNotification = (n: AppNotification) => {
    vm.markRead(n.id);
    // مقصد را سرور تعیین می‌کند؛ قفل‌ها به صفحه‌ی سطح‌ها می‌روند.
    const path = toAppPath(n.linkUrl);
    // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ پویا در زمانِ کامپایل شناخته نیست.
    if (path) router.push(path as Href);
  };

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="اعلان‌ها" />
        <RowsSkeleton count={7} />
      </ScreenContainer>
    );
  }

  if (vm.error && vm.items.length === 0) {
    return (
      <ScreenContainer>
        <StackHeader title="اعلان‌ها" />
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StackHeader
        title="اعلان‌ها"
        trailing={
          vm.hasUnread ? (
            <Pressable
              onPress={vm.markAllRead}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => [styles.readAll, pressed && styles.pressed]}
            >
              <Text style={styles.readAllText}>خواندنِ همه</Text>
            </Pressable>
          ) : undefined
        }
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NotificationCard n={item} onPress={openNotification} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
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
              icon="bell"
              title="هنوز اعلانی نداری"
              hint="وقتی کسی دنبالت کند، پسندت کند یا پیام بدهد، همین‌جا خبردار می‌شوی."
            />
          </View>
        }
        ListFooterComponent={
          vm.loadingMore ? (
            <ActivityIndicator color={colors.gold} style={styles.footer} />
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const AVATAR = 46;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
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
  cardUnread: { backgroundColor: colors.surface2, borderColor: colors.goldSoft },
  pressed: { opacity: 0.8 },
  avatarWrap: { width: AVATAR, height: AVATAR },
  stack: { flexDirection: 'row-reverse', alignItems: 'center' },
  stackItem: { alignItems: 'center', justifyContent: 'center' },
  stackBehind: {
    position: 'absolute',
    right: -14,
    width: 38,
    height: 38,
    borderRadius: 19,
    zIndex: -1,
    opacity: 0.6,
  },
  lockedAvatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    // شبیه‌سازیِ «مات»: هویت پیدا نیست، فقط قابِ خاکستری با نشانِ قفل.
    opacity: 0.85,
  },
  systemAvatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindChip: {
    position: 'absolute',
    bottom: -2,
    left: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  time: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
  count: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  lockTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  lockTagText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  readAllText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  readAll: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  footer: { paddingVertical: spacing.lg },
});
