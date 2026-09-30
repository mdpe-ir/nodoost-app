import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BottomSheet } from '@/presentation/components/BottomSheet';
import { Icon } from '@/presentation/components/Icon';
import { PressableScale } from '@/presentation/components/PressableScale';
import { AccountRow } from './AccountRow';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

/** پس‌زمینه‌ی رهای ردیف‌های کنشی — همان الگوی `SettingsRow`. */
const ACT_ROW_BG = 'rgba(30,24,38,0)';

/**
 * برگهی سوییچِ اکانت — معادلِ تلگرامی‌اش همان برگه‌ای است که با لمسِ آواتار در
 * هدر باز می‌شود: فهرستِ حساب‌ها، «افزودن حساب» و «مدیریتِ حساب‌ها و دستگاه‌ها».
 *
 * چرا برگه و نه صفحه‌ی کامل: جابه‌جاییِ حساب یک کنشِ لحظه‌ای است، نه یک مقصد.
 * کاربر می‌خواهد ببیند کدام حساب‌ها روی دستگاه است و یکی را بزند؛ بردنش به یک
 * صفحه‌ی تازه برای این کار یک پله‌ی اضافه است.
 */
export function SwitchAccountSheet({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const { accounts, activeId, switchAccount, logout, logoutAccount } = useSession();
  const { accounts: accountsCfg } = useRemoteConfig();
  const [busyId, setBusyId] = useState<string | null>(null);

  const atCap = accounts.length >= accountsCfg.maxAccounts;
  const active = accounts.find((a) => a.id === activeId) ?? null;

  const handleSwitch = async (id: string) => {
    if (id === activeId) {
      onDismiss();
      return;
    }
    setBusyId(id);
    // برگه پیش از جابه‌جایی بسته می‌شود: سوییچ کلِ زیردرختِ داده را بازمی‌سازد و
    // برگه هم با آن از صحنه می‌رود؛ بستنِ صریح از یک لحظه پرش جلوگیری می‌کند.
    onDismiss();
    router.replace('/discover');
    try {
      await switchAccount(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleLogoutOne = async (id: string) => {
    setBusyId(id);
    try {
      await logoutAccount(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleLogoutActive = async () => {
    onDismiss();
    await logout();
  };

  const goAdd = () => {
    onDismiss();
    router.push('/add-account');
  };

  const goManage = () => {
    onDismiss();
    router.push('/accounts');
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={styles.title}>حساب‌ها</Text>
      <Text style={styles.sub}>برای جابه‌جایی روی هر حساب بزن.</Text>

      <View style={styles.list}>
        {accounts.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            active={a.id === activeId}
            busy={busyId !== null}
            onPress={() => handleSwitch(a.id)}
            onLogout={() => handleLogoutOne(a.id)}
          />
        ))}
      </View>

      {atCap ? (
        <View style={styles.capRow}>
          <Icon name="lock" size={16} tint="muted" />
          <Text style={styles.capText}>
            سقفِ {faNum(accountsCfg.maxAccounts)} حساب روی این دستگاه پر شده است.
          </Text>
        </View>
      ) : (
        <PressableScale
          onPress={goAdd}
          scaleTo={0.985}
          bg={ACT_ROW_BG}
          bgPressed={colors.surface}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="افزودن حساب"
        >
          <View style={styles.actionChip}>
            <Icon name="plus" size={18} tint="gold" />
          </View>
          <Text style={styles.actionText}>افزودن حساب</Text>
        </PressableScale>
      )}

      <PressableScale
        onPress={goManage}
        scaleTo={0.985}
        bg={ACT_ROW_BG}
        bgPressed={colors.surface}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel="مدیریتِ حساب‌ها و دستگاه‌ها"
      >
        <View style={styles.actionChip}>
          <Icon name="phone" size={18} tint="gold" />
        </View>
        <Text style={styles.actionText}>مدیریتِ حساب‌ها و دستگاه‌ها</Text>
      </PressableScale>

      {active ? (
        <PressableScale
          onPress={handleLogoutActive}
          scaleTo={0.985}
          bg={ACT_ROW_BG}
          bgPressed={colors.roseFaint}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="خروج از این حساب"
        >
          <View style={[styles.actionChip, styles.actionChipDanger]}>
            <Icon name="log-out" size={18} tint="gold" />
          </View>
          <Text style={[styles.actionText, styles.actionTextDanger]}>خروج از این حساب</Text>
        </PressableScale>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: spacing.sm,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  list: { gap: spacing.xs },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  actionChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChipDanger: { backgroundColor: colors.roseFaint, borderWidth: 1, borderColor: colors.roseSoft },
  actionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionTextDanger: { color: colors.rose },
  capRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  capText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
