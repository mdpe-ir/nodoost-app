import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { mediaUrl } from '@/core/http/mediaUrl';
import { colors, radius } from '@/core/theme';
import type { Candidate } from '@/domain/entities';

interface Props {
  /** کارت‌های پشتِ کارتِ رو — نزدیک‌ترین اول. حداکثر دو تا استفاده می‌شود. */
  upcoming: Candidate[];
  /** پیشرفتِ کشیدنِ کارتِ رو (‎−۱ تا ۱) که SwipeCard می‌نویسد. */
  progress: SharedValue<number>;
  /** کارتِ رو — روی دسته می‌نشیند. */
  children: React.ReactNode;
}

/** حالتِ استراحت و حالتِ «کارتِ رو دارد می‌رود» برای هر لایه‌ی پشتی. */
const LAYERS = [
  { restScale: 0.94, restY: 14, restOpacity: 0.75, liveScale: 1, liveY: 0, liveOpacity: 1 },
  { restScale: 0.88, restY: 27, restOpacity: 0.4, liveScale: 0.94, liveY: 14, liveOpacity: 0.75 },
];

/**
 * دسته‌ی کارت‌ها — امضای بصریِ کاوش.
 *
 * ایده در یک جمله: دسته منتظرِ تصمیم نمی‌ماند، هم‌زمان با انگشت جلو می‌آید.
 * هر چه کارتِ رو را بیشتر بکشی، کارتِ بعدی بزرگ‌تر و روشن‌تر می‌شود و سرِ
 * جای کارتِ رو می‌نشیند؛ رها که کنی، فنر برش می‌گرداند. نتیجه این است که
 * کشیدن یک کنشِ برگشت‌پذیرِ پیوسته حس می‌شود، نه دکمه‌ای که یا زده‌ای یا نه.
 *
 * تفاوتش با نسخه‌ی قبلی: آن‌جا دو `View`ِ خاکستریِ ثابت بود که هیچ‌وقت تکان
 * نمی‌خورد. جسمی که به فشار جواب نمی‌دهد، جسم نیست — تصویرِ جسم است، و
 * دقیقاً همان چیزی است که رابط را بی‌روح می‌کند.
 */
export function CardDeck({ upcoming, progress, children }: Props) {
  return (
    <View style={styles.wrap}>
      {/* از دورترین به نزدیک‌ترین چیده می‌شود تا ترتیبِ لایه‌ها درست باشد. */}
      {LAYERS.map((layer, i) => i).reverse().map((i) => (
        <BackingCard key={i} candidate={upcoming[i]} layer={LAYERS[i]} progress={progress} />
      ))}
      {children}
    </View>
  );
}

function BackingCard({
  candidate,
  layer,
  progress,
}: {
  candidate?: Candidate;
  layer: (typeof LAYERS)[number];
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    // قدرِ مطلق: دسته به «شدتِ تصمیم» جواب می‌دهد، نه به جهتش. پسند و رد هر
    // دو یعنی این کارت دارد می‌رود.
    const t = interpolate(Math.abs(progress.value), [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: layer.restOpacity + (layer.liveOpacity - layer.restOpacity) * t,
      transform: [
        { translateY: layer.restY + (layer.liveY - layer.restY) * t },
        { scale: layer.restScale + (layer.liveScale - layer.restScale) * t },
      ],
    };
  });

  const photo = mediaUrl(candidate?.photoUrl);

  return (
    <Animated.View style={[styles.backing, style]} pointerEvents="none">
      {photo ? (
        <>
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
          {/* کارتِ پشتی نباید با کارتِ رو رقابتِ بصری کند. */}
          <View style={styles.dim} />
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  backing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,9,16,0.55)' },
});
