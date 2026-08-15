import React, { useState } from 'react';
import { View, Text, Modal, TextInput, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { Button } from './Button';
import { Icon } from './Icon';
import { copyOf, reviewCopy, type ReviewConfig } from '@/core/config/reviewConfig';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** حداکثرِ متنِ بازخورد — سرور هم همین را کوتاه می‌کند. */
const MAX_NOTE = 1000;

export type ReviewChoice =
  | { kind: 'happy' }
  | { kind: 'store' }
  | { kind: 'later' }
  | { kind: 'never' }
  | { kind: 'unhappy'; note: string };

interface Props {
  visible: boolean;
  cfg: ReviewConfig;
  onChoose: (choice: ReviewChoice) => void;
}

/**
 * پنجره‌ی «درواز‌ه‌ی نظر» — دو مرحله‌ای.
 *
 *   ۱) از نودوست راضی هستی؟   [راضی‌ام] [نه چندان] [بعداً]
 *   ۲الف) راضی  ⇒ دعوت به ثبتِ نظر در کافه‌بازار
 *   ۲ب)  ناراضی ⇒ جعبه‌ی متنِ کوتاه که به تیکتِ پشتیبانی تبدیل می‌شود
 *
 * چرا دو مرحله و نه یک دکمه‌ی مستقیمِ «امتیاز بده»: نظرِ منفی روی صفحه‌ی فروشگاه
 * برگشت‌ناپذیر است، ولی همان حرف داخلِ اپ قابلِ رسیدگی است. کاربرِ ناراضی هم
 * حس می‌کند شنیده شده، به‌جای اینکه به فروشگاه پرت شود.
 *
 * صرفاً نمایشی است: تصمیم‌ها را به بیرون می‌دهد و هیچ درخواستی نمی‌فرستد.
 */
export function ReviewPromptModal({ visible, cfg, onChoose }: Props) {
  const [step, setStep] = useState<'ask' | 'thanks' | 'feedback'>('ask');
  const [note, setNote] = useState('');

  // بستن با دکمه‌ی برگشت = «بعداً»؛ هرگز به‌معنای «هرگز نپرس» گرفته نمی‌شود.
  const close = () => {
    onChoose(step === 'feedback' ? { kind: 'unhappy', note: '' } : { kind: 'later' });
    reset();
  };

  const reset = () => {
    setStep('ask');
    setNote('');
  };

  const happy = () => {
    onChoose({ kind: 'happy' });
    setStep('thanks');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name={step === 'feedback' ? 'tab-chat' : 'star'} size={28} tint="gold" />
          </View>

          {step === 'ask' ? (
            <>
              <Text style={styles.title}>{copyOf(cfg.title, reviewCopy.title)}</Text>
              <Text style={styles.hint}>{copyOf(cfg.body, reviewCopy.body)}</Text>
              <View style={styles.actions}>
                <Button
                  label={copyOf(cfg.happyLabel, reviewCopy.happyLabel)}
                  icon="heart-fill"
                  onPress={happy}
                  style={styles.btnFull}
                />
                <Button
                  label={copyOf(cfg.unhappyLabel, reviewCopy.unhappyLabel)}
                  variant="outline"
                  onPress={() => setStep('feedback')}
                  style={styles.btnFull}
                />
              </View>
              <View style={styles.footRow}>
                <PressableScale onPress={close} hitSlop={8} scaleTo={0.85} feedback="select">
                  <Text style={styles.footLink}>{copyOf(cfg.laterLabel, reviewCopy.laterLabel)}</Text>
                </PressableScale>
                <Text style={styles.footSep}>·</Text>
                <PressableScale
                  onPress={() => {
                    onChoose({ kind: 'never' });
                    reset();
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.footLink}>دیگر نپرس</Text>
                </PressableScale>
              </View>
            </>
          ) : null}

          {step === 'thanks' ? (
            <>
              <Text style={styles.title}>{copyOf(cfg.thanksTitle, reviewCopy.thanksTitle)}</Text>
              <Text style={styles.hint}>{copyOf(cfg.thanksBody, reviewCopy.thanksBody)}</Text>
              <View style={styles.actions}>
                <Button
                  label={copyOf(cfg.storeLabel, reviewCopy.storeLabel)}
                  icon="star"
                  onPress={() => {
                    onChoose({ kind: 'store' });
                    reset();
                  }}
                  style={styles.btnFull}
                />
                <Button
                  label="الان نه"
                  variant="ghost"
                  onPress={close}
                  style={styles.btnFull}
                />
              </View>
            </>
          ) : null}

          {step === 'feedback' ? (
            <>
              <Text style={styles.title}>
                {copyOf(cfg.feedbackPrompt, reviewCopy.feedbackPrompt)}
              </Text>
              <Text style={styles.hint}>
                هرچه بنویسی مستقیم به پشتیبانی می‌رسد و همان‌جا جوابت را می‌دهیم.
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="مثلاً: پیام‌هایم دیر می‌رسد…"
                placeholderTextColor={colors.ink3}
                multiline
                maxLength={MAX_NOTE}
                style={styles.input}
              />
              <View style={styles.actions}>
                <Button
                  label="ارسال به پشتیبانی"
                  icon="tab-chat"
                  disabled={note.trim().length === 0}
                  onPress={() => {
                    onChoose({ kind: 'unhappy', note: note.trim() });
                    reset();
                  }}
                  style={styles.btnFull}
                />
                <Button label="بی‌خیال" variant="ghost" onPress={close} style={styles.btnFull} />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.gold2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  input: {
    width: '100%',
    minHeight: 92,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    textAlign: 'right',
    textAlignVertical: 'top',
    writingDirection: 'rtl',
  },
  actions: { width: '100%', marginTop: spacing.lg, gap: spacing.sm },
  btnFull: { width: '100%' },
  footRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footLink: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  footSep: { color: colors.ink3, fontSize: fontSizes.xs },
});
