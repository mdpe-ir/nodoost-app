import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { EmptyState } from '@/presentation/components/EmptyState';
import { NudgeBanner } from '@/presentation/components/NudgeBanner';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { mediaUrl } from '@/core/http/mediaUrl';
import { useExploreViewModel } from '@/presentation/hooks/useExploreViewModel';
import type { Candidate } from '@/domain/entities';
import { colors, fonts, fontSizes, spacing, radius, shadow } from '@/core/theme';

function formatDistance(m?: number): string | null {
  if (m == null) return null;
  if (m >= 1000) return `${(m / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} کیلومتر`;
  return `${m.toLocaleString('fa-IR')} متر`;
}

const GAP = spacing.sm;
const COLS = 2;

export function ExploreScreen() {
  const vm = useExploreViewModel();
  const { width } = useWindowDimensions();
  const cellW = (width - 18 * 2 - GAP * (COLS - 1)) / COLS;

  const renderItem = ({ item }: { item: Candidate }) => (
    <Pressable
      style={[styles.cell, { width: cellW, height: cellW * 1.32 }]}
      onPress={() => vm.select(item)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {mediaUrl(item.photoUrl) ? (
        <Image source={{ uri: mediaUrl(item.photoUrl) }} style={styles.cellImg} contentFit="cover" transition={160} />
      ) : (
        <View style={[styles.cellImg, styles.cellFallback]}>
          <Avatar name={item.name} size={64} />
        </View>
      )}
      <View style={styles.cellScrim} />
      {item.tier && item.tier >= 2 ? (
        <View style={styles.cellBadge}>
          <TierBadge tier={item.tier} height={20} />
        </View>
      ) : null}
      <View style={styles.cellMeta}>
        <Text style={styles.cellName} numberOfLines={1}>
          {item.name}
          {item.age ? <Text style={styles.cellAge}>{`  ${item.age}`}</Text> : null}
        </Text>
        {formatDistance(item.distanceM) ? (
          <Text style={styles.cellDist} numberOfLines={1}>
            {formatDistance(item.distanceM)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer flush style={styles.wrap}>
      <ScreenHeader title="اکسپلور" subtitle="چهره‌های تازه، بر اساسِ سلیقه‌ات" />

      {vm.needsLocation ? (
        <View style={styles.nudgeWrap}>
          <NudgeBanner
            icon="shield"
            title="موقعیتت روشن نیست"
            hint="بدونِ موقعیت، دیگران تو را در اکسپلور نمی‌بینند. روشنش کن تا پیدات کنند."
            ctaLabel="روشن کردنِ موقعیت"
            busy={vm.locating}
            onPress={vm.enableLocation}
          />
        </View>
      ) : null}

      {vm.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon={vm.error ? 'rewind' : 'star'}
            title={vm.error ? 'اتصال برقرار نشد' : 'فعلاً کسی نمونده'}
            hint={
              vm.error
                ? `ارتباط با سرور ناموفق بود (${vm.error}).`
                : 'کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی.'
            }
          />
          <Pressable style={styles.reload} onPress={vm.reload} accessibilityRole="button">
            <Icon name="rewind" size={16} tint="gold" />
            <Text style={styles.reloadText}>بارگذاریِ دوباره</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(c) => String(c.id)}
          renderItem={renderItem}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={vm.loadMore}
          refreshControl={
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.gold} />
          }
          ListFooterComponent={
            vm.loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.gold} />
              </View>
            ) : null
          }
        />
      )}

      {/* برگه‌ی پیش‌نمایشِ کوچک — با کنشِ پسند/رد */}
      {vm.selected ? (
        <>
          <Pressable style={styles.backdrop} onPress={vm.dismissSelected} accessibilityLabel="بستن" />
          <Animated.View entering={FadeInUp.duration(200)} style={styles.sheet}>
            <View style={styles.sheetHero}>
              {mediaUrl(vm.selected.photoUrl) ? (
                <Image source={{ uri: mediaUrl(vm.selected.photoUrl) }} style={styles.sheetImg} contentFit="cover" />
              ) : (
                <View style={[styles.sheetImg, styles.cellFallback]}>
                  <Avatar name={vm.selected.name} size={96} />
                </View>
              )}
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.sheetName}>
                {vm.selected.name}
                {vm.selected.age ? <Text style={styles.sheetAge}>{`  ${vm.selected.age}`}</Text> : null}
              </Text>
              {formatDistance(vm.selected.distanceM) ? (
                <Text style={styles.sheetDist}>{formatDistance(vm.selected.distanceM)}</Text>
              ) : null}
              {vm.selected.bio ? (
                <Text style={styles.sheetBio} numberOfLines={3}>
                  {vm.selected.bio}
                </Text>
              ) : null}
              <View style={styles.sheetActions}>
                <Pressable
                  style={[styles.fab, styles.pass]}
                  onPress={() => vm.swipe(vm.selected!, 'pass')}
                  accessibilityRole="button"
                  accessibilityLabel="رد"
                >
                  <Icon name="close" size={26} tint="white" />
                </Pressable>
                <Pressable
                  style={[styles.fab, styles.like, shadow.gold]}
                  onPress={() => vm.swipe(vm.selected!, 'like')}
                  accessibilityRole="button"
                  accessibilityLabel="پسند"
                >
                  <Icon name="heart-fill" size={24} tint="ink" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}

      {/* پوششِ مَچ — همانندِ صفحه‌ی کاوش */}
      {vm.match ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.matchCard}>
            <Avatar uri={vm.match.peer?.photoUrl} name={vm.match.peer?.name} size={108} ring />
            <Text style={styles.matchKicker}>هر دو همدیگر را پسندیدید</Text>
            <Text style={styles.matchTitle}>با {vm.match.peer?.name} مَچ شدی!</Text>
            <Pressable
              style={[styles.matchBtn, shadow.gold]}
              onPress={() => {
                const id = vm.match?.matchId;
                const name = vm.match?.peer?.name ?? '';
                vm.dismissMatch();
                if (id) router.push({ pathname: '/thread/[id]', params: { id: String(id), name } });
                else router.push('/chat');
              }}
            >
              <Text style={styles.matchBtnText}>شروعِ گفتگو</Text>
            </Pressable>
            <Pressable onPress={vm.dismissMatch} hitSlop={10}>
              <Text style={styles.matchLater}>بعداً</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18 },
  nudgeWrap: { marginBottom: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: spacing.xl },
  row: { gap: GAP, marginBottom: GAP },
  footer: { paddingVertical: spacing.lg },
  cell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cellImg: { width: '100%', height: '100%' },
  cellFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  cellScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(12,8,10,0.55)',
  },
  cellBadge: { position: 'absolute', top: 8, left: 8 },
  cellMeta: { position: 'absolute', right: 10, left: 10, bottom: 10 },
  cellName: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink, textAlign: 'right' },
  cellAge: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2 },
  cellDist: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink2, textAlign: 'right', marginTop: 2 },
  reload: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  reloadText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,5,7,0.72)' },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.gold,
  },
  sheetHero: { width: '100%', height: 220 },
  sheetImg: { width: '100%', height: '100%' },
  sheetBody: { padding: spacing.lg },
  sheetName: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.ink, textAlign: 'right' },
  sheetAge: { fontFamily: fonts.regular, fontSize: fontSizes.lg, color: colors.ink2 },
  sheetDist: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, textAlign: 'right', marginTop: 4 },
  sheetBio: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right', marginTop: spacing.sm, lineHeight: 22 },
  sheetActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.lg },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  pass: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  like: { backgroundColor: colors.gold },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,8,10,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  matchCard: { alignItems: 'center' },
  matchKicker: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, marginTop: spacing.lg, marginBottom: spacing.sm },
  matchTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.gold2, textAlign: 'center', marginBottom: spacing.xl },
  matchBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xxl,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.onGold },
  matchLater: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, marginTop: spacing.md },
});
