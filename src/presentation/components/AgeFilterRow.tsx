import React, { useState } from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { Chip } from './Chip';
import { TierLockModal } from './TierLockModal';
import { tierName } from './TierBadge';
import { PAGE_PADDING } from './ScreenContainer';
import { AGE_RANGE_OPTIONS, isSameAgeRange } from '@/core/config/ageFilter';
import { spacing, radius } from '@/core/theme';
import type { AgeRange } from '@/domain/entities';

/**
 * ردیفِ چیپِ فیلترِ سن (افقی).
 * گزینه‌ی «همه» برای همه باز است؛ بقیه‌ی بازه‌ها از حداقلِ سطحِ مشخص‌شده باز می‌شوند.
 */
export function AgeFilterRow({
  value,
  onChange,
  canFilter,
  requiredTier,
  inset = PAGE_PADDING,
  style,
}: {
  value: AgeRange | null;
  onChange: (a: AgeRange | null) => void;
  canFilter: boolean;
  requiredTier: number;
  inset?: number;
  style?: ViewStyle;
}) {
  const [lock, setLock] = useState(false);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingHorizontal: inset }]}
        style={[styles.filterScroll, { marginHorizontal: -inset }, style]}
      >
        {AGE_RANGE_OPTIONS.map((o) => {
          const isAll = o.key === 'all';
          const locked = !canFilter && !isAll;
          const active = isAll
            ? !value || (value.min == null && value.max == null)
            : isSameAgeRange(value, o.range);

          return (
            <Chip
              key={o.key}
              label={locked ? `${o.label} · قفل` : o.label}
              active={active}
              onPress={() => {
                if (locked) {
                  setLock(true);
                } else {
                  onChange(isAll ? null : active ? null : (o.range ?? null));
                }
              }}
              style={locked ? { ...styles.filterChip, ...styles.filterChipLocked } : styles.filterChip}
            />
          );
        })}
      </ScrollView>
      <TierLockModal
        visible={lock}
        requiredTier={requiredTier}
        title="فیلترِ سن قفل است"
        message={`فیلترِ بازه‌ی سن از سطحِ ${tierName(requiredTier)} باز می‌شود. برای استفاده، حسابت را ارتقا بده.`}
        feature="فیلترِ سن"
        onClose={() => setLock(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 50,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChip: {
    height: 40,
    minHeight: 0,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  filterChipLocked: { opacity: 0.5 },
});
