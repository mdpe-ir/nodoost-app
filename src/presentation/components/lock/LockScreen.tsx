import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { PinDots, PinPad } from '@/presentation/components/lock/PinPad';
import { PatternLock } from '@/presentation/components/lock/PatternLock';
import { PressableScale } from '@/presentation/components/PressableScale';
import { Icon } from '@/presentation/components/Icon';
import { haptics } from '@/core/haptics';
import { patternToSecret } from '@/core/security/passcode';
import { getBiometricCapability } from '@/core/security/biometrics';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useAppLock } from '@/presentation/providers/AppLockProvider';
import type { AppLockRecord } from '@/core/storage/appLockStorage';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

/**
 * پوششِ تمامصفحهی قفل.
 *
 * راز را میخواهد و اگر کسی رمز را گم کرده، فقط یک راه دارد: خروج از همهی
 * حسابهای دستگاه — که خودش قفل را هم برمیدارد. ریکاوریِ جدا (ایمیل، سؤالِ
 * امنیتی) نمیگذاریم چون رمزِ محلی هرگز به سرور نرفته تا از آنجا برگردانده
 * شود؛ هر راهِ «بازیابیِ» دیگر یعنی سوراخِ همان اندازهی قفل.
 *
 * بیومتریک مثلِ تلگرام «میانبر» است نه جایگزین: اگر کاربر فعالش کرده و
 * دستگاه سختافزارش را دارد، همین که صفحهی قفل بالا میآید درخواستِ اثر
 * انگشت/چهره خودکار میآید — و دکمهی اثر انگشت هم همیشه آن پایین هست برای
 * وقتی که دیالوگِ سیستمی را بسته. رمزِ اصلی همیشه پشتِ آن آماده است.
 */
export function LockScreen({ record }: { record: AppLockRecord }) {
  const { verify, disable, biometricEnabled, unlockWithBiometrics } = useAppLock();
  const { logoutAll } = useSession();
  const [pin, setPin] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [patternResetKey, setPatternResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  /** تا دیالوگِ خودکار فقط یک بار در هر قفلشدن بیاید، نه با هر ری‌رندر. */
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void getBiometricCapability().then((cap) => {
      if (alive) setBioAvailable(cap.available);
    });
    return () => {
      alive = false;
    };
  }, []);

  const tryBiometric = async () => {
    const res = await unlockWithBiometrics();
    if (!res.success && !res.cancelled) {
      // بیومتریک نخواند (نه انصراف) — بی‌صدا میمانیم؛ رمز همان‌جاست.
      haptics.warn();
    }
  };

  // درخواستِ خودکارِ بیومتریک هنگامِ بالا آمدنِ صفحهی قفل.
  useEffect(() => {
    if (!biometricEnabled || !bioAvailable || autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled, bioAvailable]);

  const check = async (secret: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await verify(secret);
      if (ok) {
        haptics.success();
        return;
      }
      haptics.error();
      setErrorKey((k) => k + 1);
      setPatternResetKey((k) => k + 1);
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const pressDigit = (digit: string) => {
    const next = pin + digit;
    setPin(next);
    if (next.length >= record.length) void check(next);
  };

  const forgot = () => {
    Alert.alert(
      'رمز را فراموش کردهای؟',
      'با خروج از همهی حسابهای این دستگاه، قفل هم برداشته میشود و باید دوباره با کدِ پیامک وارد شوی.',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'خروج از همه',
          style: 'destructive',
          onPress: () => {
            void logoutAll();
            void disable();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.fill} accessibilityViewIsModal>
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>نودوست</Text>
      </View>

      <Text style={styles.title}>قفل است</Text>

      {record.type === 'pin' ? (
        <>
          <PinDots length={pin.length} capacity={record.length} errorKey={errorKey} />
          <PinPad onDigit={pressDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} backspaceEnabled={pin.length > 0} disabled={busy} />
        </>
      ) : (
        <PatternLock
          onEnd={(dots) => {
            if (dots.length > 0) void check(patternToSecret(dots));
          }}
          disabled={busy}
          resetKey={patternResetKey}
        />
      )}

      {biometricEnabled && bioAvailable ? (
        <PressableScale
          onPress={() => void tryBiometric()}
          scaleTo={0.9}
          style={styles.bio}
          accessibilityRole="button"
          accessibilityLabel="بازکردن با اثر انگشت"
          disabled={busy}
        >
          <Icon name="fingerprint" size={34} tint="gold" />
        </PressableScale>
      ) : null}

      <PressableScale onPress={forgot} scaleTo={0.97} style={styles.forgot}>
        <Text style={styles.forgotText}>رمز را فراموش کردهام</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
    paddingHorizontal: spacing.xl,
  },
  logoWrap: { marginBottom: spacing.sm },
  logo: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    marginBottom: spacing.xl,
  },
  bio: {
    marginTop: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  forgot: { marginTop: spacing.md, padding: spacing.md },
  forgotText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
  },
});
