import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const NAMES: Record<number, string> = { 1: 'نقره‌ای', 2: 'طلایی', 3: 'پلاتینیوم', 4: 'الماس' };

export function tierName(t: number): string {
  return NAMES[t] || '';
}

export function TierBadge({ tier }: { tier: number }) {
  if (!tier || tier < 2) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{NAMES[tier] || ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 50,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.medium, fontSize: 11, color: colors.gold2 },
});
