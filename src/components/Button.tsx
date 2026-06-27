import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'ghost';
  style?: ViewStyle;
}

export function Button({ label, onPress, loading, disabled, variant = 'gold', style }: Props) {
  const gold = variant === 'gold';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        gold ? styles.gold : styles.ghost,
        off && styles.off,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={gold ? colors.onGold : colors.gold} />
      ) : (
        <Text style={[styles.label, { color: gold ? colors.onGold : colors.ink }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  gold: { backgroundColor: colors.gold },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  off: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.medium, fontSize: 16 },
});
