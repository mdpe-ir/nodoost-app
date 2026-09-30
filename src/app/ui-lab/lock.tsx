import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { PinDots, PinPad } from '@/presentation/components/lock/PinPad';
import { PatternLock } from '@/presentation/components/lock/PatternLock';
import { patternToSecret } from '@/core/security/passcode';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

/**
 * آزمایشگاهِ قفل — زمینِ بازی برای کیپد، نقطههای رمز و قفلِ الگویی.
 * همانند بقیهی ui-lab، فقط رندرِ کامپوننتها با دادهی ساختگی است؛ این صفحه
 * به هیچ پرووایدری وصل نیست و در هیچ جریانی باز نمیشود.
 */
export default function LockLab() {
  const [pin, setPin] = useState('۱۲۳');
  const [pattern, setPattern] = useState<string | null>(null);

  return (
    <ScreenContainer>
      <StackHeader title="آزمایشگاه — قفل" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>نقطههای رمز + کیپد</Text>
        <PinDots length={pin.length} capacity={6} />
        <PinPad
          onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
          onBackspace={() => setPin((p) => p.slice(0, -1))}
          backspaceEnabled={pin.length > 0}
          onSubmit={() => setPin('')}
          submitEnabled={pin.length >= 4}
        />

        <Text style={styles.section}>قفلِ الگویی</Text>
        <PatternLock onEnd={(dots) => setPattern(dots.length ? patternToSecret(dots) : null)} />
        {pattern ? <Text style={styles.result}>{pattern}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  result: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.gold,
    textAlign: 'center',
  },
});
