import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, ScreenHeader, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { ExploreView } from '@/presentation/screens/ExploreScreen';
import { MapView } from '@/presentation/screens/MapScreen';
import { spacing } from '@/core/theme';

type Mode = 'grid' | 'map';

const MODES: { key: Mode; label: string }[] = [
  { key: 'grid', label: 'چهره‌ها' },
  { key: 'map', label: 'نقشه' },
];

/** صفحه‌ی «اطراف» — شبکه‌ی چهره‌ها و نقشه، زیرِ یک سقف با سوییچِ نما. */
export function NearbyScreen() {
  const [mode, setMode] = useState<Mode>('grid');

  return (
    <ScreenContainer flush>
      <View style={styles.head}>
        <ScreenHeader title="اطراف" subtitle="آدم‌های نزدیکِ تو" />
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      </View>
      <View style={styles.body}>{mode === 'grid' ? <ExploreView /> : <MapView />}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: PAGE_PADDING },
  body: { flex: 1, marginTop: spacing.md },
});
