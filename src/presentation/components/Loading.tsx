import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/core/theme';

export function Loading() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
