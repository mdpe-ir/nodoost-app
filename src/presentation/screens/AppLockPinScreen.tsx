import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { PinDots, PinPad } from '@/presentation/components/lock/PinPad';
import { useAppLock } from '@/presentation/providers/AppLockProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { haptics } from '@/core/haptics';
import { isNumericSecret } from '@/core/security/passcode';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

type Phase = 'enter' | 'confirm';

/**
 * تنظیمِ رمزِ عددی — دو مرحله: انتخاب و تأیید.
 *
 * طولِ رمز انتخابِ کاربر است (۴ تا ۶ رقم) و با دکمهی تأییدِ کیپد ثبت میشود؛
 * ثبتِ خودکارِ سرِ حداقل یعنی کسی که رمزِ ۵ رقمی میخواست همیشه ۴ رقمی
 * میگرفت. تأییدِ دوم برای این است که «رمزی که خودم اشتباه تایپ کردم» از روز
 * اول قفل نماند.
 */
export function AppLockPinScreen() {
  const { configure } = useAppLock();
  const { appLock: cfg } = useRemoteConfig();
  const [phase, setPhase] = useState<Phase>('enter');
  const [pin, setPin] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const capacity = cfg.maxDigits;

  const submit = async (code: string) => {
    if (!isNumericSecret(code) || code.length < cfg.minDigits || code.length > cfg.maxDigits) {
      setErrorKey((k) => k + 1);
      setPin('');
      return;
    }
    if (phase === 'enter') {
      haptics.success();
      setPhase('confirm');
      setPin('');
      return;
    }
    setBusy(true);
    try {
      await configure('pin', code);
      haptics.success();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const title =
    phase === 'enter'
      ? `رمزی بین ${faNum(cfg.minDigits)} تا ${faNum(cfg.maxDigits)} رقم انتخاب کن`
      : 'برای اطمینان، دوباره واردش کن';

  return (
    <ScreenContainer>
      <StackHeader title="رمز عددی" />
      <Text style={styles.title}>{title}</Text>
      <PinDots length={pin.length} capacity={capacity} errorKey={errorKey} />
      <PinPad
        onDigit={(d) => setPin((p) => (p.length < capacity ? p + d : p))}
        onBackspace={() => setPin((p) => p.slice(0, -1))}
        backspaceEnabled={pin.length > 0}
        disabled={busy}
        onSubmit={() => void submit(pin)}
        submitEnabled={pin.length >= cfg.minDigits}
      />
      {errorKey > 0 ? (
        <Text style={styles.error}>
          رمز باید {faNum(cfg.minDigits)} تا {faNum(cfg.maxDigits)} رقم باشد.
        </Text>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
