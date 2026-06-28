import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  icon?: IconName;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={styles.badge}>
          <Icon name={icon} size={30} tint="gold" />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
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
    lineHeight: 22,
  },
});
