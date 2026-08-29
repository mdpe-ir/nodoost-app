import React, { useState } from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { Chip } from './Chip';
import { TierLockModal } from './TierLockModal';
import { tierName } from './TierBadge';
import { PAGE_PADDING } from './ScreenContainer';
import { spacing, radius } from '@/core/theme';
import type { GenderFilter } from '@/domain/entities';

export const DISCOVER_GENDER_OPTIONS: { key: GenderFilter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

/** چهره‌نما: «همه» یعنی بدون قید (رشته‌ی خالی برای API). */
export const EXPLORE_GENDER_OPTIONS: { key: GenderFilter; label: string }[] = [
  { key: '', label: 'همه' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

/**
 * ردیفِ چیپِ فیلترِ جنسیت. گزینه‌ی `freeKey` بدون اشتراک هم قابلِ انتخاب است
 * (پیش‌فرضِ همان صفحه)؛ بقیه قفل‌اند و برگه‌ی ارتقا را باز می‌کنند.
 */
export function GenderFilterRow({
  value,
  onChange,
  canFilter,
  requiredTier,
  options,
  freeKey,
  inset = PAGE_PADDING,
  style,
}: {
  value: GenderFilter;
  onChange: (g: GenderFilter) => void;
  canFilter: boolean;
  requiredTier: number;
  options: { key: GenderFilter; label: string }[];
  freeKey: GenderFilter;
  /** padding افقیِ میزبان — ردیف به لبه‌ی صفحه اسکرول می‌شود. */
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
        {options.map((o) => {
          const locked = !canFilter && o.key !== freeKey;
          return (
            <Chip
              key={o.key || 'all'}
              label={locked ? `${o.label} · قفل` : o.label}
              active={value === o.key}
              onPress={() => {
                if (locked) setLock(true);
                else if (o.key !== value) onChange(o.key);
              }}
              style={locked ? { ...styles.filterChip, ...styles.filterChipLocked } : styles.filterChip}
            />
          );
        })}
      </ScrollView>
      <TierLockModal
        visible={lock}
        requiredTier={requiredTier}
        title="فیلترِ جنسیت قفل است"
        message={`فیلترِ جنسیت از سطحِ ${tierName(requiredTier)} باز می‌شود. برای استفاده، حسابت را ارتقا بده.`}
        feature="فیلترِ جنسیت"
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
