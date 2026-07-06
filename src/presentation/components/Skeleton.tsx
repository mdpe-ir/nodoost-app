import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '@/core/theme';

/** بلوکِ اسکلتیِ نبض‌دار برای حالتِ بارگذاری */
export function Skeleton({
  width = '100%',
  height = 16,
  br = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  br?: number;
  style?: ViewStyle;
}) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: br, backgroundColor: colors.surface2 }, animated, style]}
    />
  );
}

/** اسکلتِ کارتِ کاوش */
export function CardSkeleton() {
  return (
    <View style={styles.deck}>
      <Skeleton width="100%" height="100%" br={radius.xl} />
    </View>
  );
}

/** اسکلتِ سطرهای لیست (گفتگو) — راست‌چین */
export function RowsSkeleton({ count = 7 }: { count?: number }) {
  return (
    <View style={{ paddingTop: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rowMid}>
            <Skeleton width="55%" height={15} style={{ alignSelf: 'flex-end' }} />
            <Skeleton width="80%" height={12} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
          </View>
          <Skeleton width={54} height={54} br={27} />
        </View>
      ))}
    </View>
  );
}

/** اسکلتِ شبکه‌ی کاشی (پسندها) */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width="47%" height={120} br={radius.lg} style={{ marginBottom: 14 }} />
      ))}
    </View>
  );
}

/** اسکلتِ پروفایلِ خودم — آواتارِ گرد + خط‌ها + شبکه‌ی عکس. */
export function ProfileSkeleton() {
  return (
    <View style={styles.profileWrap}>
      <Skeleton width={124} height={124} br={62} style={{ alignSelf: 'center' }} />
      <Skeleton width={140} height={18} style={{ alignSelf: 'center', marginTop: 14 }} />
      <Skeleton width={90} height={12} style={{ alignSelf: 'center', marginTop: 8 }} />
      <Skeleton width="100%" height={64} br={radius.lg} style={{ marginTop: 24 }} />
      <Skeleton width="45%" height={16} style={{ alignSelf: 'flex-end', marginTop: 24 }} />
      <View style={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="31%" height={120} br={radius.md} style={{ marginTop: 12 }} />
        ))}
      </View>
    </View>
  );
}

/** اسکلتِ پروفایلِ دیگران — کارتِ عکسِ بزرگ + خط‌ها. */
export function PeerProfileSkeleton() {
  return (
    <View style={styles.profileWrap}>
      <Skeleton width="100%" height={380} br={radius.xl} />
      <Skeleton width="50%" height={20} style={{ alignSelf: 'flex-end', marginTop: 18 }} />
      <Skeleton width="30%" height={13} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
      <Skeleton width="90%" height={13} style={{ alignSelf: 'flex-end', marginTop: 20 }} />
      <Skeleton width="70%" height={13} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
      <Skeleton width="100%" height={50} br={radius.md} style={{ marginTop: 24 }} />
    </View>
  );
}

/** اسکلتِ حباب‌های گفتگو — چپ/راستِ متناوب. */
export function BubblesSkeleton({ count = 6 }: { count?: number }) {
  const widths = [150, 210, 120, 180, 140, 200];
  return (
    <View style={styles.bubbles}>
      {Array.from({ length: count }).map((_, i) => {
        const mine = i % 2 === 0;
        return (
          <Skeleton
            key={i}
            width={widths[i % widths.length]}
            height={40}
            br={radius.lg}
            style={{ alignSelf: mine ? 'flex-end' : 'flex-start', marginTop: 10 }}
          />
        );
      })}
    </View>
  );
}

/** اسکلتِ تمام‌صفحه‌ی نقشه. */
export function MapSkeleton() {
  return <Skeleton width="100%" height="100%" br={radius.lg} />;
}

const styles = StyleSheet.create({
  deck: { flex: 1, marginVertical: 12 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 12, gap: 14 },
  rowMid: { flex: 1 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 6 },
  profileWrap: { paddingTop: 8 },
  bubbles: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
});
