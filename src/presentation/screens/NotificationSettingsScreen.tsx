import React from 'react';
import { View, Text, ScrollView, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Icon } from '@/presentation/components/Icon';
import {
  useNotificationPrefsViewModel,
  type NotificationPrefKey,
} from '@/presentation/hooks/useNotificationPrefsViewModel';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

interface RowDef {
  key: NotificationPrefKey;
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  hint: string;
}

const ROWS: RowDef[] = [
  { key: 'follows', icon: 'plus', title: 'دنبال‌کردن', hint: 'وقتی کسی تو را دنبال می‌کند' },
  { key: 'likes', icon: 'heart-fill', title: 'پسندها', hint: 'وقتی کسی پروفایلت را می‌پسندد' },
  { key: 'matches', icon: 'star', title: 'مَچ‌ها', hint: 'وقتی با کسی به هم می‌رسید' },
  { key: 'messages', icon: 'tab-chat', title: 'پیام‌ها', hint: 'وقتی پیامِ تازه‌ای می‌گیری' },
  { key: 'profileViews', icon: 'tab-profile', title: 'بازدیدِ پروفایل', hint: 'وقتی کسی پروفایلت را می‌بیند' },
  { key: 'system', icon: 'shield', title: 'اطلاعیه‌های نودوست', hint: 'خبرهای مهم و تغییراتِ حساب' },
];

/** تنظیماتِ اعلان — هر سوییچ مستقل و بی‌درنگ ذخیره می‌شود. */
export function NotificationSettingsScreen() {
  const vm = useNotificationPrefsViewModel();

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="تنظیماتِ اعلان" />
        <RowsSkeleton count={6} />
      </ScreenContainer>
    );
  }

  if (vm.error) {
    return (
      <ScreenContainer>
        <StackHeader title="تنظیماتِ اعلان" />
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StackHeader title="تنظیماتِ اعلان" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>
          انتخاب کن برای کدام اتفاق‌ها به تو خبر بدهیم. هر زمان می‌توانی تغییرش بدهی.
        </Text>
        <View style={styles.group}>
          {ROWS.map((row, i) => (
            <View key={row.key}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={styles.chip}>
                  <Icon name={row.icon} size={18} tint="gold" />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title}>{row.title}</Text>
                  <Text style={styles.hint}>{row.hint}</Text>
                </View>
                {vm.saving === row.key ? (
                  <View style={styles.switchSlot}>
                    <ActivityIndicator size="small" color={colors.gold} />
                  </View>
                ) : (
                  <Switch
                    value={vm.prefs[row.key]}
                    onValueChange={(v) => vm.update(row.key, v)}
                    trackColor={{ false: colors.line, true: colors.goldSoft }}
                    thumbColor={vm.prefs[row.key] ? colors.gold : colors.ink3}
                    accessibilityLabel={row.title}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  scroll: { paddingBottom: spacing.xxl },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: spacing.md },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  // هم‌اندازه با Switch تا هنگامِ نمایشِ لودر چیدمان نپرد.
  switchSlot: { width: 51, height: 31, alignItems: 'center', justifyContent: 'center' },
});
