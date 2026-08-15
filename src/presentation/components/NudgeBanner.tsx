import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PressableScale } from './PressableScale';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, type IconName } from './Icon';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

interface Props {
  icon?: IconName;
  title: string;
  hint?: string;
  ctaLabel: string;
  onPress: () => void;
  busy?: boolean;
  onDismiss?: () => void;
}

/** بنرِ راهنمای کوتاه؛ برای تشویقِ کاربر به تکمیلِ کاری که تجربه‌اش را کامل می‌کند. */
export function NudgeBanner({ icon = 'shield', title, hint, ctaLabel, onPress, busy, onDismiss }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(240)} style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name={icon} size={18} tint="gold" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        <PressableScale
          style={styles.cta}
          onPress={onPress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          scaleTo={0.94}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.gold2} />
          ) : (
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          )}
        </PressableScale>
      </View>
      {onDismiss ? (
        <PressableScale onPress={onDismiss} hitSlop={10} accessibilityLabel="بستن" scaleTo={0.85} feedback="select">
          <Icon name="close" size={16} tint="ink" />
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    marginBottom: spacing.md,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'right' },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    minWidth: 96,
    alignItems: 'center',
  },
  ctaText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.onGold },
});
