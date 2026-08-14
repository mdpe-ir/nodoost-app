import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, ScreenHeader, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { ExploreView } from '@/presentation/screens/ExploreScreen';
import { MapView } from '@/presentation/screens/MapScreen';
import { RandomView } from '@/presentation/screens/RandomScreen';
import { spacing } from '@/core/theme';

type Mode = 'grid' | 'map' | 'random';

const MODES: { key: Mode; label: string }[] = [
  { key: 'grid', label: 'چهره‌ها' },
  { key: 'map', label: 'نقشه' },
  { key: 'random', label: 'تصادفی' },
];

const SUBTITLE: Record<Mode, string> = {
  grid: 'آدم‌های نزدیکِ تو',
  map: 'آدم‌های نزدیکِ تو',
  random: 'با یک غریبه‌ی نزدیک، گفتگوی زنده را شروع کن',
};

/**
 * صفحه‌ی «اطراف» — سه راهِ رسیدن به آدم‌های نزدیک: شبکه‌ی چهره‌ها، نقشه، و
 * گفتگوی تصادفی. «تصادفی» تبِ جداگانه‌ی خودش را داشت؛ این‌جا آمد چون هر سه
 * یک کار می‌کنند (پیدا کردنِ آدمِ نزدیک) و جای تبِ میانی به قهرمانی رسید.
 */
export function NearbyScreen() {
  const [mode, setMode] = useState<Mode>('grid');

  return (
    <ScreenContainer flush>
      <View style={styles.head}>
        <ScreenHeader title="اطراف" subtitle={SUBTITLE[mode]} />
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      </View>
      <View style={styles.body}>
        {mode === 'grid' ? <ExploreView /> : mode === 'map' ? <MapView /> : <RandomView />}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: PAGE_PADDING },
  body: { flex: 1, marginTop: spacing.md },
});
