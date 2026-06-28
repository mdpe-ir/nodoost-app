import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

interface Props {
  icon?: string;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.wrap}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  icon: { fontSize: 40, marginBottom: spacing.md },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
