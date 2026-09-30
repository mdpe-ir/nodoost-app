import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Skeleton } from '@/presentation/components/Skeleton';
import { PhotoViewer } from '@/presentation/components/PhotoViewer';
import { Icon } from '@/presentation/components/Icon';
import {
  useSharedMediaViewModel,
  type SharedMediaKind,
} from '@/presentation/hooks/useSharedMediaViewModel';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { haptics } from '@/core/haptics';
import { faNum } from '@/core/utils/faNum';
import { faDuration, faJalali } from '@/core/utils/time';
import type { SharedMediaItem } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

const GRID_GAP = 2;

/**
 * مدیای اشتراکی — صفحهی «رسانه‌ها و فایل‌ها»ی تلگرام: هر عکسی که در گفتگو
 * رد و بدل شده، در یک گریدِ سه‌ستونه، از تازه به قدیم. مدیا با توکنِ احراز
 * گرفته می‌شود، پس هر کاشی uriِ خودش را جدا رزولو میکند (همان مسیرِ حبابِ
 * عکس در گفتگو) و تا رسیدنِ آن، اسکلت نبض می‌زند.
 */
export function SharedMediaScreen({ matchId, name }: { matchId: number; name?: string }) {
  const vm = useSharedMediaViewModel(matchId);
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 2 * GRID_GAP) / 3);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const title = name ? `مدیای گفتگو با ${name}` : 'مدیای اشتراکی';

  return (
    <ScreenContainer>
      <StackHeader title={title} />
      <View style={styles.tabsWrap}>
        <SegmentedControl<SharedMediaKind>
          options={[
            { key: 'photo', label: `عکس‌ها (${faNum(vm.counts.photo)})` },
            { key: 'voice', label: `صداها (${faNum(vm.counts.voice)})` },
          ]}
          value={vm.kind}
          onChange={(k) => {
            haptics.select();
            vm.switchKind(k);
          }}
        />
      </View>

      {vm.loading ? (
        <GridSkeleton tile={tile} />
      ) : vm.error ? (
        <EmptyState
          icon="rewind"
          title="مدیا بارگذاری نشد"
          hint="ارتباط با سرور ناموفق بود."
          actionLabel="تلاشِ دوباره"
          onAction={() => void vm.reload()}
        />
      ) : vm.items.length === 0 ? (
        <EmptyState
          icon={vm.kind === 'photo' ? 'paperclip' : 'mic'}
          title={vm.kind === 'photo' ? 'هنوز عکسی رد و بدل نشده' : 'هنوز پیامِ صوتی نیست'}
          hint={
            vm.kind === 'photo'
              ? 'اولین عکس را بفرست تا این‌جا دیده شود.'
              : 'اولین پیامِ صوتی را بفرست.'
          }
        />
      ) : vm.kind === 'photo' ? (
        <FlatList
          data={vm.items}
          numColumns={3}
          keyExtractor={(it) => String(it.id)}
          onEndReached={() => void vm.loadMore()}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <PhotoTile item={item} matchId={matchId} size={tile} onOpen={setViewerUri} />
          )}
          ListFooterComponent={
            vm.loadingMore ? <ActivityIndicator style={styles.footer} color={colors.gold} /> : null
          }
        />
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(it) => String(it.id)}
          onEndReached={() => void vm.loadMore()}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <VoiceRow item={item} />}
          ListFooterComponent={
            vm.loadingMore ? <ActivityIndicator style={styles.footer} color={colors.gold} /> : null
          }
        />
      )}

      <PhotoViewer visible={!!viewerUri} uri={viewerUri} onClose={() => setViewerUri(null)} />
    </ScreenContainer>
  );
}

/** یک کاشیِ عکس — uriِ رسانه را با توکن می‌گیرد و تا رسیدنش اسکلت نشان میدهد. */
function PhotoTile({
  item,
  matchId,
  size,
  onOpen,
}: {
  item: SharedMediaItem;
  matchId: number;
  size: number;
  onOpen: (uri: string) => void;
}) {
  const { uri, loading, error } = useChatMediaUri(matchId, item.id, 'photo');
  return (
    <View style={[styles.tileWrap, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.tileImage}
          contentFit="cover"
          transition={140}
          cachePolicy="memory-disk"
          recyclingKey={`shared-${item.id}`}
          accessibilityRole="image"
          accessibilityLabel="عکسِ اشتراکی"
        />
      ) : error ? (
        <View style={styles.tileSkeleton}>
          <Icon name="close" size={16} tint="muted" />
        </View>
      ) : (
        <Skeleton width="100%" height="100%" br={0} style={styles.tileSkeleton} />
      )}
      {/*
       * تا uri نرسیده، کاشی قابلِ تپ نیست — لایت‌باکسِ خالی بازکردنِ حفره است.
       * Pressable بدونِ بازخوردِ مقیاس: کاشیها فاصلهی ۲px دارند و شورتی که
       * کل گرید را بلغزاند حسِ بدی میدهد؛ فشردنِ پسزمینه کافی است.
       */}
      {uri && !loading ? (
        <Pressable
          style={[styles.tilePress, { width: size, height: size }]}
          onPress={() => {
            haptics.tap();
            if (uri) onOpen(uri);
          }}
          accessibilityRole="button"
          accessibilityLabel="نمایشِ عکس"
        />
      ) : null}
    </View>
  );
}

/** سطرِ پیامِ صوتی — خلاصهی مدیا؛ پخشِ خود از دلِ گفتگو انجام می‌شود. */
function VoiceRow({ item }: { item: SharedMediaItem }) {
  return (
    <View style={styles.voiceRow}>
      <View style={styles.voiceChip}>
        <Icon name="mic" size={18} tint="gold" />
      </View>
      <View style={styles.voiceBody}>
        <Text style={styles.voiceTitle}>
          پیامِ صوتی · {faDuration(item.mediaMeta?.durationMs)}
        </Text>
        {item.createdAt ? (
          <Text style={styles.voiceDate}>{faJalali(item.createdAt, false)}</Text>
        ) : null}
      </View>
    </View>
  );
}

function GridSkeleton({ tile }: { tile: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} width={tile} height={tile} br={0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  grid: { gap: GRID_GAP, paddingBottom: spacing.xl },
  gridRow: { justifyContent: 'space-between' },
  tileWrap: { position: 'relative' },
  tileImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  tileSkeleton: { flex: 1, borderRadius: 0 },
  tilePress: { position: 'absolute', top: 0, left: 0 },
  list: { paddingBottom: spacing.xl },
  voiceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  voiceChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  voiceTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  voiceDate: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: { paddingVertical: spacing.lg },
});

