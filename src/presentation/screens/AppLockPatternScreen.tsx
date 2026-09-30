import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { PatternLock } from '@/presentation/components/lock/PatternLock';
import { useAppLock } from '@/presentation/providers/AppLockProvider';
import { haptics } from '@/core/haptics';
import { patternToSecret } from '@/core/security/passcode';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

type Phase = 'enter' | 'confirm';

/**
 * تنظیمِ قفلِ الگویی — دو مرحله: کشیدن و کشیدنِ دوباره.
 *
 * «الگوی ناقص» (کمتر از ۴ نقطه) از خودِ PatternLock برنمیگردد؛ فقط لغو است
 * و صفحه را ناراحت نمیکند. ناهماهنگیِ دو مرحله الگو را از اول میخواهد —
 * هشِ میانی هیچوقت جایی ذخیره نمیشود که لازمش داشته باشیم.
 */
export function AppLockPatternScreen() {
  const { configure } = useAppLock();
  const [phase, setPhase] = useState<Phase>('enter');
  const [first, setFirst] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const handleEnd = async (dots: number[]) => {
    if (dots.length === 0 || busy) return;
    const secret = patternToSecret(dots);
    if (phase === 'enter') {
      haptics.success();
      setFirst(secret);
      setPhase('confirm');
      setResetKey((k) => k + 1);
      return;
    }
    if (secret !== first) {
      haptics.error();
      setResetKey((k) => k + 1);
      setFirst(null);
      setPhase('enter');
      return;
    }
    setBusy(true);
    try {
      await configure('pattern', secret);
      haptics.success();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const title =
    phase === 'enter' ? 'یک الگو بکش — حداقل ۴ نقطه' : 'برای اطمینان، همان الگو را دوباره بکش';

  return (
    <ScreenContainer>
      <StackHeader title="الگو" />
      <Text style={styles.title}>{title}</Text>
      <PatternLock
        onEnd={(dots) => void handleEnd(dots)}
        disabled={busy}
        resetKey={resetKey}
      />
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
    marginBottom: spacing.lg,
  },
});
