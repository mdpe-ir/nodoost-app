import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  icon?: IconName;
  title: string;
  hint?: string;
  /** کنشِ اختیاری (مثلاً «بارگذاریِ دوباره»). */
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconName;
}

export function EmptyState({ icon, title, hint, actionLabel, onAction, actionIcon = 'rewind' }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={styles.wrap}>
      {icon ? (
        <View style={styles.badge}>
          <Icon name={icon} size={30} tint="gold" />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {actionLabel && onAction ? (
        <PressableScale style={styles.action} onPress={onAction} accessibilityRole="button" scaleTo={0.94}>
          <Icon name={actionIcon} size={16} tint="gold" />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'center' },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: lineHeights.sm,
    maxWidth: 280,
  },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  actionText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
});
