import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { PressableScale } from './PressableScale';
import { Icon } from './Icon';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { haptics } from '@/core/haptics';
import { faNum } from '@/core/utils/faNum';
import type { SharedMediaItem, SharedMediaCounts } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

const THUMB = 56;

/**
 * ردیفِ «مدیای اشتراکی» در اطلاعاتِ مخاطب — همان ردیفِ رسانه‌ها در پروفایلِ
 * مخاطبِ تلگرام: سه کاشیِ آخر + شمارنده‌ی کل، با پرش به گریدِ کامل.
 *
 * چرا خودش uri رزولو می‌کند: رسانه‌ی گفتگو پشتِ احراز است و url خام سمتِ
 * کلاینت معنا ندارد؛ هر کاشی مثلِ حبابِ عکسِ گفتگو، فایلش را جدا می‌گیرد.
 */
export function SharedMediaPreviewRow({
  matchId,
  items,
  counts,
  onOpen,
}: {
  matchId: number;
  /** تا ۳ قلمِ آخرِ مدیای عکس (از ویومدلِ اطلاعاتِ مخاطب). */
  items: SharedMediaItem[];
  counts: SharedMediaCounts;
  onOpen: () => void;
}) {
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onOpen();
      }}
      accessibilityRole="button"
      accessibilityLabel="مدیای اشتراکی"
      scaleTo={0.985}
      style={styles.row}
    >
      <View style={styles.strip}>
        {items.slice(0, 3).map((it) => (
          <SharedThumb key={it.id} matchId={matchId} messageId={it.id} />
        ))}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>مدیای اشتراکی</Text>
        <Text style={styles.hint}>
          {faNum(counts.photo)} عکس · {faNum(counts.voice)} پیامِ صوتی
        </Text>
      </View>
      <Icon name="chevron-prev" size={16} tint="gold" />
    </PressableScale>
  );
}

/** یک کاشیِ کوچک — تا رسیدنِ رسانه، قابِ خاکستری میماند. */
function SharedThumb({ matchId, messageId }: { matchId: number; messageId: number }) {
  const { uri, error } = useChatMediaUri(matchId, messageId, 'photo');
  return (
    <View style={styles.thumb}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.thumbImage}
          contentFit="cover"
          transition={140}
          cachePolicy="memory-disk"
          recyclingKey={`shared-thumb-${messageId}`}
        />
      ) : (
        <View style={[styles.thumbImage, styles.thumbEmpty]}>
          {!error ? <View style={styles.thumbDot} /> : <Icon name="close" size={12} tint="muted" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  strip: { flexDirection: 'row-reverse', gap: 2 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  body: { flex: 1, alignItems: 'flex-end', gap: 2 },
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
