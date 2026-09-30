import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { PressableScale } from '@/presentation/components/PressableScale';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import type { AccountMeta } from '@/domain/entities';

/**
 * پس‌زمینه‌ی رهای ردیف — همان الگوی `SettingsRow`: از `transparent` استفاده
 * نمی‌کنیم چون میان‌یابیِ رنگ از سیاه رد می‌شود و ردیف موقعِ رهاشدن تیره می‌زند.
 */
const ROW_BG = 'rgba(30,24,38,0)';

/** شماره با ‎09…‎ به‌جای ‎+98…‎ — در RTL علامتِ ‎+‎ به انتهای رشته می‌پرد. */
const localPhone = (phone?: string) => (phone ? faNum(phone.replace(/^\+98/, '0')) : '');

interface Props {
  account: AccountMeta;
  active: boolean;
  /** در حالِ سوییچ یا خروج — همه‌ی دکمه‌ها قفل می‌شوند. */
  busy?: boolean;
  onPress: () => void;
  onLogout: () => void;
}

/**
 * یک ردیفِ اکانت در برگه‌ی سوییچ — به سبکِ تلگرام: آواتار، نام، شماره و تیکِ
 * اکانتِ فعال. اکانتِ فعال دکمه‌ی خروج ندارد (خروجِ آن از دکمه‌ی پایینِ صفحه
 * یا صفحه‌ی «حساب‌ها» انجام می‌شود) تا یک لمسِ اشتباه کلِ اکانت را نبرد.
 */
export function AccountRow({ account, active, busy, onPress, onLogout }: Props) {
  const phone = localPhone(account.phone);
  const title = account.name?.trim() || (phone ? `حسابِ ${phone}` : 'حساب');
  const note =
    account.status === 'banned'
      ? 'مسدود شده'
      : account.status === 'pending_review'
        ? 'در انتظارِ تأیید'
        : null;

  return (
    <View style={[styles.row, active && styles.rowActive]}>
      <PressableScale
        onPress={active ? undefined : onPress}
        disabled={active || busy}
        scaleTo={0.985}
        bg={ROW_BG}
        bgPressed={colors.surface}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={active ? `${title} — حسابِ فعال` : `ورود به ${title}`}
      >
        <Avatar uri={account.photoUrl} name={account.name || account.phone} size={44} ring={active} />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {phone ? <Text style={styles.phone}>{phone}</Text> : null}
          {note ? <Text style={styles.warn}>{note}</Text> : null}
        </View>
      </PressableScale>

      {active ? (
        <View style={styles.check}>
          <Icon name="check" size={18} tint="gold" />
        </View>
      ) : (
        <PressableScale
          onPress={onLogout}
          disabled={busy}
          scaleTo={0.88}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel={`خروج از ${title}`}
        >
          <Icon name="log-out" size={18} tint="muted" />
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  main: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  body: { flex: 1, alignItems: 'flex-end', gap: 2 },
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  phone: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, writingDirection: 'ltr' },
  warn: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.rose },
  check: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logout: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
