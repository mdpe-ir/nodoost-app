import React, { useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/core/theme';
import { faNum } from '@/core/utils/faNum';
import {
  gregorianToJalali,
  JALALI_MONTHS,
  type JalaliDate,
  jalaliMonthLength,
} from '@/core/utils/jalali';
import { AppText } from '@/presentation/components/AppText';
import { BottomSheet } from '@/presentation/components/BottomSheet';
import { Button } from '@/presentation/components/Button';
import {
  WHEEL_HEIGHT_TOTAL,
  WheelPicker,
  WheelSelectionBand,
} from '@/presentation/components/WheelPicker';

const TODAY = new Date();
export const CURRENT_JALALI_YEAR = gregorianToJalali(
  TODAY.getFullYear(),
  TODAY.getMonth() + 1,
  TODAY.getDate(),
).year;

/** Default starting point for birthdate selection: 25 years old. */
export const DEFAULT_JALALI_BIRTHDATE: JalaliDate = {
  year: CURRENT_JALALI_YEAR - 25,
  month: 1,
  day: 1,
};

export type JalaliDatePickerProps = {
  value: JalaliDate;
  onChange: (value: JalaliDate) => void;
  minYear?: number;
  maxYear?: number;
  style?: ViewStyle;
};

/**
 * 3-column snap wheel picker for Jalali dates (Day, Month, Year), inspired by Fitdate.
 *
 * RTL layout: Day is on the right, Month in the middle, and Year on the left,
 * so «۱۵ فروردین ۱۳۸۰» reads naturally from right to left.
 *
 * Automatically re-clamps days when switching month or year (e.g. 31st to Mehr or Esfand).
 */
export function JalaliDatePicker({
  value,
  onChange,
  minYear = CURRENT_JALALI_YEAR - 99,
  maxYear = CURRENT_JALALI_YEAR - 18,
  style,
}: JalaliDatePickerProps) {
  const daysInMonth = jalaliMonthLength(value.year, value.month);

  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, index) => {
        const year = maxYear - index;
        return { value: String(year), label: faNum(year) };
      }),
    [maxYear, minYear],
  );

  const months = useMemo(
    () =>
      JALALI_MONTHS.map((title, index) => ({
        value: String(index + 1),
        label: title,
      })),
    [],
  );

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, index) => ({
        value: String(index + 1),
        label: faNum(index + 1),
      })),
    [daysInMonth],
  );

  /**
   * Ref holding the latest date, readable synchronously.
   * Prevents racing column commits from overwriting each other.
   */
  const pending = useRef(value);
  useEffect(() => {
    pending.current = value;
  }, [value]);

  const update = (patch: Partial<JalaliDate>) => {
    const next = { ...pending.current, ...patch };
    // Clamp AFTER the change, against the new month/year
    next.day = Math.min(next.day, jalaliMonthLength(next.year, next.month));
    pending.current = next;
    onChange(next);
  };

  return (
    <View style={[styles.container, style]}>
      <WheelSelectionBand />
      <View style={styles.columnsRow}>
        <WheelPicker
          label="روز"
          items={days}
          value={String(value.day)}
          onChange={(day) => update({ day: Number(day) })}
        />
        <WheelPicker
          label="ماه"
          items={months}
          value={String(value.month)}
          onChange={(month) => update({ month: Number(month) })}
          flex={1.4}
        />
        <WheelPicker
          label="سال"
          items={years}
          value={String(value.year)}
          onChange={(year) => update({ year: Number(year) })}
        />
      </View>
    </View>
  );
}

export type JalaliDatePickerSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  value: JalaliDate;
  onConfirm: (value: JalaliDate) => void;
  title?: string;
  minYear?: number;
  maxYear?: number;
};

/**
 * Bottom-sheet presentation of the JalaliDatePicker with confirmation button and title.
 */
export function JalaliDatePickerSheet({
  visible,
  onDismiss,
  value,
  onConfirm,
  title = 'انتخاب تاریخ تولد',
  minYear,
  maxYear,
}: JalaliDatePickerSheetProps) {
  const [prevValue, setPrevValue] = useState<JalaliDate>(value);
  const [draft, setDraft] = useState<JalaliDate>(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const handleConfirm = () => {
    onConfirm(draft);
    onDismiss();
  };

  const formattedDraft = `${faNum(draft.day)} ${JALALI_MONTHS[draft.month - 1]} ${faNum(draft.year)}`;

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.sheetContent}>
        <View style={styles.sheetHeader}>
          <AppText variant="heading" align="center" weight="bold">
            {title}
          </AppText>
          <AppText variant="body" color="gold2" align="center" style={styles.datePreview}>
            {formattedDraft}
          </AppText>
        </View>

        <View style={styles.pickerWrapper}>
          <JalaliDatePicker
            value={draft}
            onChange={setDraft}
            minYear={minYear}
            maxYear={maxYear}
          />
        </View>

        <View style={styles.sheetFooter}>
          <Button
            label="تأیید تاریخ"
            variant="gold"
            size="lg"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WHEEL_HEIGHT_TOTAL,
    width: '100%',
    position: 'relative',
  },
  columnsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    width: '100%',
    height: '100%',
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  sheetHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  datePreview: {
    marginTop: spacing.xs,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  sheetFooter: {
    marginTop: spacing.sm,
  },
});
