import React, { useState } from 'react';
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
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { GridSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Scrim } from '@/presentation/components/Scrim';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { mediaUrl } from '@/core/http/mediaUrl';
import { useLikesViewModel } from '@/presentation/hooks/useLikesViewModel';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import type { Liker } from '@/domain/entities';

const GAP = spacing.sm;
const COLS = 3;

type Tab = 'received' | 'sent';

const TABS: { key: Tab; label: string }[] = [
  { key: 'received', label: 'پسندم کرده‌اند' },
  { key: 'sent', label: 'پسندیده‌ام' },
];

/** کاشیِ یک نفر — با عکس، نام و سن؛ اگر id معتبر باشد به پروفایلش می‌رود. */
function LikerTile({ liker, w, h }: { liker: Liker; w: number; h: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width: w, height: h }, pressed && styles.tilePressed]}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(liker.id) } })}
      accessibilityRole="button"
      accessibilityLabel={liker.name ?? 'پروفایل'}
    >
      {mediaUrl(liker.photoUrl) ? (
        <Image
          source={{ uri: mediaUrl(liker.photoUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={160}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tileFallback]}>
          <Text style={styles.tileInitial}>{(liker.name || '؟').charAt(0)}</Text>
        </View>
      )}
      <Scrim height="55%" />
      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {liker.name ?? 'بی‌نام'}
          {liker.age ? <Text style={styles.tileAge}>{`  ${faNum(liker.age)}`}</Text> : null}
        </Text>
      </View>
    </Pressable>
  );
}

export function LikesScreen() {
  const vm = useLikesViewModel();
  const [tab, setTab] = useState<Tab>('received');
  const { width } = useWindowDimensions();
  const tileW = (width - PAGE_PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.28;

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="پسندها" />
        <GridSkeleton count={6} />
      </ScreenContainer>
    );
  }

  if (vm.error) {
    return (
      <ScreenContainer>
        <StackHeader title="پسندها" />
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

  const count = vm.data?.count ?? 0;
  const revealed = vm.data?.revealed ?? false;

  return (
    <ScreenContainer>
      <StackHeader title="پسندها" />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.gold} />
        }
        contentContainerStyle={styles.scroll}
      >
        {tab === 'received' ? (
          count === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="heart-fill"
                title="هنوز کسی پسندت نکرده"
                hint="کاوش کن و پروفایلت را کامل کن تا دیده شوی."
              />
            </View>
          ) : (
            <>
              <Text style={styles.countLine}>{faNum(count)} نفر تو را پسندیده‌اند</Text>
              {!revealed ? (
                <View style={styles.banner}>
                  <View style={styles.bannerHead}>
                    <Icon name="diamond-fill" size={20} tint="gold" />
                    <Text style={styles.bannerTitle}>ببین چه کسانی پسندت کرده‌اند</Text>
                  </View>
                  <Text style={styles.bannerText}>
                    با عضویتِ طلایی، چهره‌ی همه‌ی کسانی که تو را پسندیده‌اند آشکار می‌شود.
                  </Text>
                  <Button label="ارتقای عضویت" size="md" onPress={() => router.push('/profile')} />
                </View>
              ) : null}
              <View style={styles.grid}>
                {revealed
                  ? vm.data!.likers.map((liker) => (
                      <LikerTile key={liker.id} liker={liker} w={tileW} h={tileH} />
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
          )
        ) : vm.sent.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="star"
              title="هنوز کسی را نپسندیده‌ای"
              hint="در کاوش و اطراف بگرد و اولین پسندت را بفرست."
            />
          </View>
        ) : (
          <>
            <Text style={styles.countLine}>{faNum(vm.sent.length)} نفر را پسندیده‌ای</Text>
            <View style={styles.grid}>
              {vm.sent.map((liker) => (
                <LikerTile key={liker.id} liker={liker} w={tileW} h={tileH} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
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
