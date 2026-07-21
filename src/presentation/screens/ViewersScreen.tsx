import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScreenContainer, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { GridSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Scrim } from '@/presentation/components/Scrim';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { TierLockModal } from '@/presentation/components/TierLockModal';
import { mediaUrl } from '@/core/http/mediaUrl';
import { useCases } from '@/core/di/DIProvider';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import type { Viewer, ViewersOverview } from '@/domain/entities';

const GAP = spacing.sm;
const COLS = 3;

/** بازدیدکنندگانِ پروفایل — فهرست از طلایی (۴)، آمارِ کلِ بازدید از الماس (۵). */
export function ViewersScreen() {
  const uc = useCases();
  const [data, setData] = useState<ViewersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { width } = useWindowDimensions();
  const tileW = (width - PAGE_PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.28;

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(false);
      }
      try {
        setData(await uc.likes.getViewers());
        setError(false);
      } catch {
        if (!silent) setError(true);
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [uc]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ScreenContainer>
        <StackHeader title="بازدیدها" />
        <GridSkeleton count={6} />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <StackHeader title="بازدیدها" />
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={() => load()}
          />
        </View>
      </ScreenContainer>
    );
  }

  const count = data?.count ?? 0;
  const revealed = data?.revealed ?? false;

  return (
    <ScreenContainer>
      <StackHeader title="بازدیدها" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={colors.gold}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {count === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="tab-profile"
              title="هنوز کسی پروفایلت را ندیده"
              hint="پروفایلت را کامل کن و در کاوش فعال باش تا دیده شوی."
            />
          </View>
        ) : (
          <>
            <Text style={styles.countLine}>
              {faNum(count)} نفر پروفایلت را دیده‌اند
              {data?.totalViews != null ? ` · ${faNum(Number(data.totalViews))} بازدیدِ کل` : ''}
            </Text>
            {!revealed ? (
              <View style={styles.banner}>
                <View style={styles.bannerHead}>
                  <Icon name="diamond-fill" size={20} tint="gold" />
                  <Text style={styles.bannerTitle}>ببین چه کسانی پروفایلت را دیده‌اند</Text>
                </View>
                <Text style={styles.bannerText}>
                  با عضویتِ طلایی، چهره‌ی همه‌ی بازدیدکنندگانِ پروفایلت آشکار می‌شود.
                </Text>
                <Button label="ارتقای عضویت" size="md" onPress={() => setShowPaywall(true)} />
              </View>
            ) : null}
            <View style={styles.grid}>
              {revealed
                ? (data?.viewers ?? []).map((v) => (
                    <ViewerTile key={v.id} viewer={v} w={tileW} h={tileH} />
                  ))
                : Array.from({ length: Math.min(count, 12) }, (_, i) => (
                    <View key={`locked-${i}`} style={[styles.tile, { width: tileW, height: tileH }]}>
                      <View style={styles.lockedTile}>
                        <View style={styles.lockBadge}>
                          <Icon name="lock" size={18} tint="gold" />
                        </View>
                        <Text style={styles.lockedText}>پنهان</Text>
                      </View>
                    </View>
                  ))}
            </View>
          </>
        )}
      </ScrollView>

      <TierLockModal
        visible={showPaywall}
        requiredTier={4}
        title="دیدنِ بازدیدکننده‌ها قفل است"
        message="با عضویتِ طلایی، چهره‌ی همه‌ی بازدیدکنندگانِ پروفایلت آشکار می‌شود."
        feature="دیدنِ بازدیدکننده‌ها"
        onClose={() => setShowPaywall(false)}
      />
    </ScreenContainer>
  );
}

/** کاشیِ یک بازدیدکننده — با عکس، نام و سطح؛ تپ → پروفایل. */
function ViewerTile({ viewer, w, h }: { viewer: Viewer; w: number; h: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width: w, height: h }, pressed && styles.tilePressed]}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(viewer.id) } })}
      accessibilityRole="button"
      accessibilityLabel={viewer.name ?? 'پروفایل'}
    >
      {mediaUrl(viewer.photoUrl) ? (
        <Image
          source={{ uri: mediaUrl(viewer.photoUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={160}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tileFallback]}>
          <Text style={styles.tileInitial}>{(viewer.name || '؟').charAt(0)}</Text>
        </View>
      )}
      <Scrim height="55%" />
      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {viewer.name ?? 'بی‌نام'}
          {viewer.age ? <Text style={styles.tileAge}>{`  ${faNum(viewer.age)}`}</Text> : null}
        </Text>
        {viewer.tier ? (
          <View style={styles.tileBadge}>
            <TierBadge tier={viewer.tier} height={16} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  emptyWrap: { paddingTop: spacing.xxl * 2 },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  countLine: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  banner: {
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bannerHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.gold2,
    textAlign: 'right',
  },
  bannerText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: lineHeights.sm,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: GAP },
  tile: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tilePressed: { opacity: 0.85 },
  tileFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  tileInitial: { fontFamily: fonts.bold, fontSize: 40, color: colors.goldSoft },
  tileMeta: { position: 'absolute', right: 8, left: 8, bottom: 8 },
  tileBadge: { alignItems: 'flex-end', marginTop: 3 },
  tileName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.onPhoto,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tileAge: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.onPhotoDim },
  lockedTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink3 },
});
