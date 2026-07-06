import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/core/theme';

/** اسکریمِ تیره از بالا (شفاف) به پایین (تیره) تا متنِ روی عکس خوانا بماند. */
export function Scrim({ style, height = '62%' }: { style?: ViewStyle; height?: ViewStyle['height'] }) {
  return (
    <LinearGradient
      colors={gradients.cardScrim}
      locations={[0, 0.55, 1]}
      style={[styles.base, { height }, style]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
