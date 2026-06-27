import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink3, textAlign: 'center', lineHeight: 22 },
});
