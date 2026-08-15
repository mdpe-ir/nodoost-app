import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadow } from '@/core/theme';

type Level = 'card' | 'raised';

interface Props {
  children: React.ReactNode;
  /** `card` روی پس‌زمینه‌ی صفحه، `raised` روی یک سطحِ دیگر. */
  level?: Level;
  /** نشان‌دادنِ لبه‌ی طلایی — برای کارتی که عمداً باید جلو بیاید. */
  accent?: boolean;
  /** سایه‌ی ارتفاع. برای کارت‌های داخلِ فهرست خاموش بگذار. */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * سطحِ نوردیده — قابِ استانداردِ کارت‌ها و پنل‌ها.
 *
 * تفاوتش با یک `View` با `backgroundColor: colors.surface` دو چیزِ ریز است که
 * با هم حجم می‌سازند:
 *
 * ۱) گرادیانِ بسیار کم‌شیبِ عمودی به‌جای رنگِ تخت. چشم آن را «گرادیان»
 *    نمی‌بیند، ولی حس می‌کند نور از بالا می‌تابد. رنگِ تخت روی ده کارتِ کنارِ
 *    هم، همه را مقوا نشان می‌دهد.
 * ۲) لبه‌ی بالاییِ روشن‌تر از بقیه‌ی قاب (`colors.rim`). در نورِ کم، چیزی که
 *    جسم را از پس‌زمینه جدا می‌کند مرزِ تیره نیست — بازتابِ نور روی لبه‌ی
 *    بالایی است. همان کاری که نورِ سقفی با یک جسمِ واقعی می‌کند.
 *
 * `overflow: hidden` عمدی است تا گرادیان از گوشه‌های گرد بیرون نزند؛ اگر
 * فرزندی باید بیرونِ قاب بنشیند (نشان، آواتارِ سرریز) خودش را بیرونِ Surface
 * بگذار.
 */
export function Surface({ children, level = 'card', accent, elevated = true, style }: Props) {
  return (
    <View
      style={[
        styles.base,
        accent ? styles.accent : styles.plain,
        elevated && (level === 'raised' ? shadow.card : shadow.soft),
        style,
      ]}
    >
      <LinearGradient
        colors={level === 'raised' ? gradients.surfaceRaised : gradients.surface}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  plain: { borderColor: colors.line, borderTopColor: colors.rim },
  accent: { borderColor: colors.goldSoft, borderTopColor: colors.rimGold },
});
