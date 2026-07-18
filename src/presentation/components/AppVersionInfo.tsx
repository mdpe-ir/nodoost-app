import React from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** اطلاعاتِ نسخه‌ی نیتیو و بسته‌ی JSای که همین لحظه در حال اجراست. */
export function AppVersionInfo() {
  const appVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—';
  const buildVersion = Application.nativeBuildVersion;
  const updateId = Updates.updateId?.slice(0, 8) ?? '—';

  let status = 'نسخه‌ی برنامه';
  let description = 'اطلاعات به‌روزرسانی در این نسخه در دسترس نیست.';
  let statusColor: ColorValue = colors.ink3;

  if (Updates.isEnabled) {
    if (Updates.isEmergencyLaunch) {
      status = 'نسخه‌ی پایدار فعال است';
      description = 'برنامه برای اجرای مطمئن از نسخه‌ی پایدار استفاده می‌کند.';
      statusColor = colors.gold;
    } else if (Updates.isEmbeddedLaunch) {
      status = 'نسخه‌ی اصلی برنامه';
      description = 'برنامه با نسخه‌ی نصب‌شده در حال اجراست.';
      statusColor = colors.gold;
    } else {
      status = 'برنامه به‌روز است';
      description = 'آخرین به‌روزرسانی با موفقیت نصب شده است.';
      statusColor = colors.ok;
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>درباره‌ی برنامه</Text>
      <View style={styles.card}>
        <View style={styles.statusBox}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.statusBody}>
            <Text selectable style={[styles.statusTitle, { color: statusColor }]}>{status}</Text>
            <Text selectable style={styles.statusDescription}>{description}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <InfoRow
          label="نسخه‌ی برنامه"
          value={`${faNum(appVersion)}${buildVersion ? ` (${faNum(buildVersion)})` : ''}`}
        />
        <View style={styles.divider} />
        <InfoRow label="کد به‌روزرسانی" value={updateId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    borderCurve: 'continuous',
  },
  statusBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  statusDot: { width: 9, height: 9, borderRadius: radius.pill, marginTop: 7 },
  statusBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  statusTitle: { fontFamily: fonts.bold, fontSize: fontSizes.md, textAlign: 'right' },
  statusDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  row: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  value: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
});
