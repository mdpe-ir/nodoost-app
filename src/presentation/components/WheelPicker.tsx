import React, { useCallback, useEffect, useRef } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius } from '@/core/theme';
import { AppText } from '@/presentation/components/AppText';

export const WHEEL_ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
export const WHEEL_HEIGHT_TOTAL = WHEEL_ITEM_HEIGHT * VISIBLE_ITEMS;

export type WheelItem = { value: string; label: string };

export type WheelPickerProps = {
  items: WheelItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  flex?: number;
};

/**
 * One scrolling column of a wheel picker.
 * Inspired by Fitdate's pure React Native snap wheel picker.
 */
export function WheelPicker({ items, value, onChange, label, flex = 1 }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useRef(0);
  const committed = useRef(value);

  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  const initialIndex = useRef(index);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex.current * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
      offset.current = initialIndex.current * WHEEL_ITEM_HEIGHT;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (committed.current === value) return;
    committed.current = value;
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
  }, [index, value]);

  const commit = useCallback(() => {
    const next = Math.round(offset.current / WHEEL_ITEM_HEIGHT);
    const clamped = Math.min(Math.max(next, 0), items.length - 1);
    const picked = items[clamped];
    if (!picked || picked.value === committed.current) return;
    committed.current = picked.value;
    onChange(picked.value);
  }, [items, onChange]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(commit, 140);
    },
    [commit],
  );

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  return (
    <View
      style={[styles.column, { flex }]}
      accessibilityLabel={label}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={commit}
        contentContainerStyle={styles.contentContainer}
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <View
              key={item.value}
              style={styles.item}
            >
              <AppText
                variant={selected ? 'heading' : 'body'}
                color={selected ? 'gold2' : 'ink3'}
                weight={selected ? 'bold' : 'regular'}
                align="center"
              >
                {item.label}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * The band that marks the centre row, painted behind the columns.
 */
export function WheelSelectionBand() {
  return (
    <View
      style={styles.band}
      pointerEvents="none"
    />
  );
}

export function SingleWheelPicker(props: Omit<WheelPickerProps, 'flex'>) {
  return (
    <View style={styles.singleContainer}>
      <WheelSelectionBand />
      <WheelPicker {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    height: WHEEL_HEIGHT_TOTAL,
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingVertical: WHEEL_ITEM_HEIGHT * 2,
  },
  item: {
    width: '100%',
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_ITEM_HEIGHT * 2,
    height: WHEEL_ITEM_HEIGHT,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  singleContainer: {
    height: WHEEL_HEIGHT_TOTAL,
    width: '100%',
  },
});
