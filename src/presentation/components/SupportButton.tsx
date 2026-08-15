import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, radius } from '@/core/theme';

/**
 * دکمه‌ی پشتیبانیِ هدر — راهِ همیشه‌در‌دسترسِ رسیدن به گفتگو با پشتیبانی.
 * قابِ طلاییِ کم‌رنگ دارد تا در کنارِ زنگوله دیده شود؛ پیشتر فقط ته‌ی
 * زبانه‌ی تنظیمات پیدا می‌شد و کاربر آن را نمی‌یافت.
 */
export function SupportButton() {
  return (
    <PressableScale
      // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
      onPress={() => router.push('/support' as Href)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="پشتیبانی"
      scaleTo={0.88}
      feedback="select"
      style={styles.btn}
    >
      <View style={styles.chip}>
        {/* هدست، نه سپر: سپر «تأییدشده» معنی می‌دهد و همان‌جا کنارِ نامِ حسابِ
            پشتیبانی هم به همان معنا به کار می‌رود. */}
        <Icon name="headset" size={20} tint="gold" />
      </View>
    </PressableScale>
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
  chip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
