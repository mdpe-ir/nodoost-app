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

const styles = StyleSheet.create({
  deck: { flex: 1, marginVertical: 12 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 12, gap: 14 },
  rowMid: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 6 },
});
