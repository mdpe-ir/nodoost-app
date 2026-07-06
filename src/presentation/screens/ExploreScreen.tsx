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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { EmptyState } from '@/presentation/components/EmptyState';
import { NudgeBanner } from '@/presentation/components/NudgeBanner';
import { Avatar } from '@/presentation/components/Avatar';
import { Button } from '@/presentation/components/Button';
import { IconButton } from '@/presentation/components/IconButton';
import { MatchOverlay } from '@/presentation/components/MatchOverlay';
import { Scrim } from '@/presentation/components/Scrim';
import { TierBadge } from '@/presentation/components/TierBadge';
import { GridSkeleton } from '@/presentation/components/Skeleton';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faDistance } from '@/core/utils/faNum';
import { useExploreViewModel } from '@/presentation/hooks/useExploreViewModel';
import type { Candidate } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

const GAP = spacing.sm;
const COLS = 2;

/**
 * نمای شبکه‌ی چهره‌های نزدیک — داخلِ صفحه‌ی «اطراف» رندر می‌شود
 * (هدر و قابِ صفحه را میزبان می‌دهد).
 */
export function ExploreView() {
  const vm = useExploreViewModel();
  const { width } = useWindowDimensions();
  const cellW = (width - PAGE_PADDING * 2 - GAP * (COLS - 1)) / COLS;

  const renderItem = ({ item }: { item: Candidate }) => (
    <Animated.View entering={FadeIn.duration(220)}>
      <Pressable
        style={({ pressed }) => [
          styles.cell,
          { width: cellW, height: cellW * 1.32 },
          pressed && styles.cellPressed,
        ]}
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
        <Scrim height="52%" />
        {item.tier && item.tier >= 2 ? (
          <View style={styles.cellBadge}>
            <TierBadge tier={item.tier} height={20} />
          </View>
        ) : null}
        <View style={styles.cellMeta}>
          <Text style={styles.cellName} numberOfLines={1}>
            {item.name}
            {item.age ? <Text style={styles.cellAge}>{`  ${faNum(item.age)}`}</Text> : null}
          </Text>
          {faDistance(item.distanceM) ? (
            <Text style={styles.cellDist} numberOfLines={1}>
              {faDistance(item.distanceM)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.wrap}>
      {vm.needsLocation ? (
        <NudgeBanner
          icon="shield"
          title="موقعیتت روشن نیست"
          hint="بدونِ موقعیت، دیگران تو را در اطراف نمی‌بینند. روشنش کن تا پیدات کنند."
          ctaLabel="روشن کردنِ موقعیت"
          busy={vm.locating}
          onPress={vm.enableLocation}
        />
      ) : null}

      {vm.loading ? (
        <GridSkeleton count={6} />
      ) : vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon={vm.error ? 'rewind' : 'star'}
            title={vm.error ? 'اتصال برقرار نشد' : 'فعلاً کسی نمونده'}
            hint={
              vm.error
                ? 'ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن.'
                : 'کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی.'
            }
            actionLabel="بارگذاریِ دوباره"
            onAction={vm.reload}
          />
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
          <Animated.View entering={FadeInUp.duration(220)} style={styles.sheet}>
            <View style={styles.sheetHero}>
              {mediaUrl(vm.selected.photoUrl) ? (
                <Image source={{ uri: mediaUrl(vm.selected.photoUrl) }} style={styles.sheetImg} contentFit="cover" />
              ) : (
                <View style={[styles.sheetImg, styles.cellFallback]}>
                  <Avatar name={vm.selected.name} size={96} />
                </View>
              )}
              <Scrim height="40%" />
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.sheetName} numberOfLines={1}>
                {vm.selected.name}
                {vm.selected.age ? <Text style={styles.sheetAge}>{`  ${faNum(vm.selected.age)}`}</Text> : null}
              </Text>
              {faDistance(vm.selected.distanceM) ? (
                <Text style={styles.sheetDist}>{faDistance(vm.selected.distanceM)}</Text>
              ) : null}
              {vm.selected.bio ? (
                <Text style={styles.sheetBio} numberOfLines={3}>
                  {vm.selected.bio}
                </Text>
              ) : null}
              {/* ترتیبِ فیزیکی ثابت: رد چپ، پسند راست — هم‌قرارداد با صفحه‌ی کاوش */}
              <View style={styles.sheetActions}>
                <IconButton
                  icon="close"
                  size={58}
                  variant="surface"
                  onPress={() => vm.swipe(vm.selected!, 'pass')}
                  accessibilityLabel="رد"
                />
                <IconButton
                  icon="heart-fill"
                  size={64}
                  variant="gold"
                  onPress={() => vm.swipe(vm.selected!, 'like')}
                  accessibilityLabel="پسند"
                />
              </View>
              <Button
                label="دیدنِ کاملِ پروفایل"
                variant="outline"
                size="md"
                onPress={() => {
                  const id = vm.selected!.id;
                  vm.dismissSelected();
                  router.push({ pathname: '/user/[id]', params: { id: String(id) } });
                }}
                style={styles.sheetProfileBtn}
              />
            </View>
          </Animated.View>
        </>
      ) : null}

      {vm.match ? (
        <MatchOverlay
          peerName={vm.match.peer?.name}
          peerPhotoUrl={vm.match.peer?.photoUrl}
          onChat={() => {
            const id = vm.match?.matchId;
            const name = vm.match?.peer?.name ?? '';
            const peerId = vm.match?.peer?.id;
            const photoUrl = vm.match?.peer?.photoUrl;
            vm.dismissMatch();
            if (id) router.push({
              pathname: '/thread/[id]',
              params: { id: String(id), name, peerId: peerId ? String(peerId) : '', photoUrl: photoUrl ?? '' },
            });
            else router.push('/chat');
          }}
          onDismiss={vm.dismissMatch}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAGE_PADDING },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: spacing.xl },
  row: { flexDirection: 'row-reverse', gap: GAP, marginBottom: GAP },
  footer: { paddingVertical: spacing.lg },
  cell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cellPressed: { opacity: 0.88 },
  cellImg: { width: '100%', height: '100%' },
  cellFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  cellBadge: { position: 'absolute', top: 8, right: 8 },
  cellMeta: { position: 'absolute', right: 10, left: 10, bottom: 10 },
  cellName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.onPhoto,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cellAge: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.onPhotoDim },
  cellDist: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.onPhotoDim,
    textAlign: 'right',
    marginTop: 2,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdrop },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  sheetHero: { width: '100%', height: 230 },
  sheetImg: { width: '100%', height: '100%' },
  sheetHandle: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  sheetBody: { padding: spacing.lg },
  sheetName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetAge: { fontFamily: fonts.regular, fontSize: fontSizes.lg, color: colors.ink2 },
  sheetDist: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, textAlign: 'right', marginTop: 2 },
  sheetBio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
    lineHeight: lineHeights.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  sheetProfileBtn: { marginTop: spacing.md },
});
