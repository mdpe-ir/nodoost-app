import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { AccountRow } from '@/presentation/components/accounts/AccountRow';
import { useAccountsViewModel } from '@/presentation/hooks/useAccountsViewModel';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

/**
 * «حساب‌ها» — مدیریتِ اکانت‌های همین دستگاه.
 *
 * برگه‌ی سوییچ (که با لمسِ آواتار باز می‌شود) برای جابه‌جاییِ سریع است؛ این
 * صفحه جای کارهای سنگین‌تر است: خروجِ تک‌حساب، خروجِ همه و (بخشِ بعد) فهرستِ
 * دستگاه‌های متصل. تفکیکشان عمدی است: کاری که برگشت‌ناپذیر است نباید یک لمس
 * از جیبِ کاربر فاصله داشته باشد.
 */
export function AccountsScreen() {
  const vm = useAccountsViewModel();

  return (
    <ScreenContainer>
      <StackHeader title="حساب‌ها" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          این حساب‌ها روی همین دستگاه وارد شده‌اند. برای جابه‌جایی روی هر حساب بزن.
        </Text>

        <View style={styles.list}>
          {vm.accounts.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              active={a.id === vm.activeId}
              busy={vm.busyId !== null}
              onPress={() => vm.switchTo(a.id)}
              onLogout={() => vm.remove(a.id)}
            />
          ))}
        </View>

        {vm.atCap ? (
          <View style={styles.capRow}>
            <Icon name="lock" size={16} tint="muted" />
            <Text style={styles.capText}>
              سقفِ {faNum(vm.maxAccounts)} حساب روی این دستگاه پر شده است. برای افزودنِ
              حسابِ تازه یکی را خارج کن.
            </Text>
          </View>
        ) : (
          <Button
            label="افزودن حساب"
            icon="plus"
            variant="outline"
            onPress={vm.addAccount}
            style={styles.add}
          />
        )}

        <Text style={styles.note}>
          سقفِ {faNum(vm.maxAccounts)} حساب روی هر دستگاه. هر حساب گفتگو، پسندها و پروفایلِ
          خودش را دارد.
        </Text>

        {vm.accounts.length > 0 ? (
          <Button
            label="خروج از همه‌ی حساب‌ها"
            variant="danger"
            onPress={vm.signOutAll}
            style={styles.danger}
          />
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2 },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.sm },
  add: { marginTop: spacing.lg },
  capRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  capText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.md,
  },
  danger: { marginTop: spacing.xl },
});
