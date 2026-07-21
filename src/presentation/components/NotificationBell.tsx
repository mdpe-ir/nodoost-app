import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from './Icon';
import { CountBadge } from './CountBadge';
import { useBadges } from '@/presentation/providers/BadgesProvider';
import { colors, radius } from '@/core/theme';

/**
 * زنگوله‌ی هدر — درِ ورودیِ صفحه‌ی اعلان‌ها، با نشانِ «دیده‌نشده‌ها».
 * شمارنده از BadgesProvider می‌آید (هر ۳۰ ثانیه و با بازگشتِ اپ تازه می‌شود).
 */
export function NotificationBell() {
  const { badges } = useBadges();
  return (
    <Pressable
      // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
      onPress={() => router.push('/notifications' as Href)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="اعلان‌ها"
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <View>
        <Icon name="bell" size={22} tint="gold" />
        <CountBadge count={badges.notifications} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surface, opacity: 0.9 },
});
