import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from './Icon';
import { Chip } from './Chip';
import { BottomSheet } from './BottomSheet';
import { TierLockModal } from './TierLockModal';
import { tierName } from './TierBadge';
import { EXPLORE_GENDER_OPTIONS } from './GenderFilterRow';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import type { ActiveFilter, GenderFilter } from '@/domain/entities';

/** فیلترِ فعالیت + کمینه‌سطحِ لازم (سرور هم دوباره می‌سنجد). */
const ACTIVE_OPTIONS: { key: ActiveFilter; label: string; minTier: number }[] = [
  { key: '', label: 'همه', minTier: 1 },
  { key: 'online', label: 'آنلاین', minTier: 3 },
  { key: '1h', label: 'یک ساعتِ اخیر', minTier: 2 },
  { key: 'today', label: 'امروز', minTier: 2 },
];

const RADIUS_LADDER = [5, 10, 25, 50, 100, 200];

type LockState = { tier: number; title: string; message: string; feature: string };

interface Props {
  active: ActiveFilter;
  onActiveChange: (a: ActiveFilter) => void;
  genderFilter: GenderFilter;
  onGenderChange: (g: GenderFilter) => void;
  canFilterGender: boolean;
  genderMinTier: number;
  radiusKm: number | null;
  maxRadiusKm: number;
  onRadiusChange: (km: number | null) => void;
  myTier: number;
}

/**
 * فیلترهای نقشه — نوارِ فشرده + برگه‌ی پایینی (فعالیت، جنسیت، شعاع).
 */
export function MapFilterPanel({
  active,
  onActiveChange,
  genderFilter,
  onGenderChange,
  canFilterGender,
  genderMinTier,
  radiusKm,
  maxRadiusKm,
  onRadiusChange,
  myTier,
}: Props) {
  const [open, setOpen] = useState(false);
  const [lock, setLock] = useState<LockState | null>(null);

  const activeLabel = ACTIVE_OPTIONS.find((o) => o.key === active)?.label;
  const genderLabel = EXPLORE_GENDER_OPTIONS.find((o) => o.key === genderFilter)?.label;
  const selectedRadiusKm = radiusKm ?? maxRadiusKm;

  const radiusOptions = useMemo(() => {
    const cap = maxRadiusKm;
    if (!cap) return [] as { km: number; locked: boolean }[];
    const below = RADIUS_LADDER.filter((k) => k < cap).map((km) => ({ km, locked: false }));
    const above = RADIUS_LADDER.filter((k) => k > cap).map((km) => ({ km, locked: true }));
    return [...below, { km: cap, locked: false }, ...above];
  }, [maxRadiusKm]);

  const activeSummaries = useMemo(() => {
    const items: { key: string; label: string; onClear: () => void }[] = [];
    if (active !== '') {
      items.push({
        key: 'active',
        label: activeLabel ?? 'فعالیت',
        onClear: () => onActiveChange(''),
      });
    }
    if (genderFilter !== '') {
      items.push({
        key: 'gender',
        label: genderLabel ?? 'جنسیت',
        onClear: () => onGenderChange(''),
      });
    }
    if (radiusKm != null && maxRadiusKm > 0) {
      items.push({
        key: 'radius',
        label: `${faNum(radiusKm)} کیلومتر`,
        onClear: () => onRadiusChange(null),
      });
    }
    return items;
  }, [
    active,
    activeLabel,
    genderFilter,
    genderLabel,
    radiusKm,
    maxRadiusKm,
    onActiveChange,
    onGenderChange,
    onRadiusChange,
  ]);

  const clearAll = () => {
    if (active !== '') onActiveChange('');
    if (genderFilter !== '') onGenderChange('');
    if (radiusKm != null) onRadiusChange(null);
  };

  const showGenderLock = () =>
    setLock({
      tier: genderMinTier,
      title: 'فیلترِ جنسیت قفل است',
      message: `فیلترِ جنسیت از سطحِ ${tierName(genderMinTier)} باز می‌شود. برای استفاده، حسابت را ارتقا بده.`,
      feature: 'فیلترِ جنسیت',
    });

  return (
    <>
      <View style={styles.bar}>
        <PressableScale
          style={styles.filterBtn}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            activeSummaries.length > 0
              ? `فیلترها، ${faNum(activeSummaries.length)} فیلتر فعال`
              : 'باز کردنِ فیلترها'
          }
        >
          <Icon name="filter" size={17} tint="gold" />
          <Text style={styles.filterBtnLabel}>فیلتر</Text>
          {activeSummaries.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{faNum(activeSummaries.length)}</Text>
            </View>
          ) : null}
        </PressableScale>

        {activeSummaries.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.summaryScroll}
              contentContainerStyle={styles.summaryRow}
            >
              {activeSummaries.map((s) => (
                <PressableScale
                  key={s.key}
                  style={styles.summaryChip}
                  onPress={s.onClear}
                  accessibilityRole="button"
                  accessibilityLabel={`حذفِ فیلتر ${s.label}`}
                >
                  <Text style={styles.summaryLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Icon name="close" size={12} tint="muted" />
                </PressableScale>
              ))}
            </ScrollView>
            <PressableScale
              style={styles.clearBtn}
              onPress={clearAll}
              accessibilityRole="button"
              accessibilityLabel="پاک کردنِ همه‌ی فیلترها"
            >
              <Text style={styles.clearBtnLabel}>پاک کردن</Text>
            </PressableScale>
          </>
        ) : null}
      </View>

      <BottomSheet visible={open} onDismiss={() => setOpen(false)}>
        <Text style={styles.sheetTitle}>فیلترِ نقشه</Text>
        <Text style={styles.sheetHint}>کاربرانِ روی نقشه را محدود کن.</Text>

        <FilterSection title="فعالیت">
          {ACTIVE_OPTIONS.map((o) => {
            const locked = myTier < o.minTier;
            return (
              <Chip
                key={o.key || 'all'}
                label={locked ? `${o.label} · قفل` : o.label}
                active={active === o.key}
                onPress={() => {
                  if (locked)
                    setLock({
                      tier: o.minTier,
                      title: 'این فیلتر قفل است',
                      message: `فیلترِ «${o.label}» از سطحِ ${tierName(o.minTier)} باز می‌شود. برای استفاده، حسابت را ارتقا بده.`,
                      feature: `فیلترِ «${o.label}»`,
                    });
                  else onActiveChange(active === o.key && o.key !== '' ? '' : o.key);
                }}
                style={locked ? { ...styles.sheetChip, ...styles.sheetChipLocked } : styles.sheetChip}
              />
            );
          })}
        </FilterSection>

        <FilterSection title="جنسیت">
          {EXPLORE_GENDER_OPTIONS.map((o) => {
            const locked = !canFilterGender && o.key !== '';
            return (
              <Chip
                key={o.key || 'all'}
                label={locked ? `${o.label} · قفل` : o.label}
                active={genderFilter === o.key}
                onPress={() => {
                  if (locked) showGenderLock();
                  else if (o.key !== genderFilter) onGenderChange(o.key);
                }}
                style={locked ? { ...styles.sheetChip, ...styles.sheetChipLocked } : styles.sheetChip}
              />
            );
          })}
        </FilterSection>

        {radiusOptions.length > 0 ? (
          <FilterSection title="شعاعِ جست‌وجو">
            {radiusOptions.map((o) => (
              <Chip
                key={o.km}
                label={o.locked ? `${faNum(o.km)} کیلومتر · قفل` : `${faNum(o.km)} کیلومتر`}
                active={!o.locked && selectedRadiusKm === o.km}
                onPress={() => {
                  if (o.locked)
                    setLock({
                      tier: Math.max(2, myTier + 1),
                      title: 'شعاعِ بیشتر قفل است',
                      message: 'برای جست‌وجوی دورتر، حسابت را ارتقا بده تا سقفِ شعاعِت بیشتر شود.',
                      feature: 'شعاعِ جست‌وجوی بیشتر',
                    });
                  else onRadiusChange(o.km);
                }}
                style={o.locked ? { ...styles.sheetChip, ...styles.sheetChipLocked } : styles.sheetChip}
              />
            ))}
          </FilterSection>
        ) : null}

        {activeSummaries.length > 0 ? (
          <PressableScale
            style={styles.sheetClear}
            onPress={clearAll}
            accessibilityRole="button"
            accessibilityLabel="پاک کردنِ همه‌ی فیلترها"
          >
            <Text style={styles.sheetClearLabel}>پاک کردنِ همه</Text>
          </PressableScale>
        ) : null}
      </BottomSheet>

      <TierLockModal
        visible={lock != null}
        requiredTier={lock?.tier ?? 2}
        title={lock?.title}
        message={lock?.message}
        feature={lock?.feature}
        onClose={() => setLock(null)}
      />
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipGrid}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  filterBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    flexShrink: 0,
  },
  filterBtnLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.onGold,
  },
  summaryScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.gold,
    maxWidth: 140,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.gold2,
  },
  clearBtn: {
    flexShrink: 0,
    height: 34,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink3,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sheetChip: {
    height: 40,
    minHeight: 0,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  sheetChipLocked: { opacity: 0.5 },
  sheetClear: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  sheetClearLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
  },
});
