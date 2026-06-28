import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// اسکریمِ تیره از بالا (شفاف) به پایین (تیره) تا متنِ روی عکس خوانا بماند
const CARD_SCRIM = ['rgba(15,10,12,0)', 'rgba(15,10,12,0.5)', 'rgba(11,7,9,0.96)'] as const;

export function Scrim({ style, height = '62%' }: { style?: ViewStyle; height?: ViewStyle['height'] }) {
  return (
    <LinearGradient
      colors={CARD_SCRIM}
      locations={[0, 0.55, 1]}
      style={[styles.base, { height }, style]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
