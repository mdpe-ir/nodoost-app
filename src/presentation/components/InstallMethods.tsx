import React from 'react';
import { View, Text, Pressable, Linking, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/presentation/components/Icon';
import type { InstallMethod, InstallMethodKey } from '@/core/config/installConfig';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

const PKG = 'com.nodoost.app';

/** توضیحِ کوتاهِ هر روش، برای زیرِ عنوان. */
const METHOD_HINT: Record<string, string> = {
  bazaar: 'نصب از طریقِ کافه‌بازار',
  myket: 'نصب از طریقِ مایکت',
  direct: 'دانلودِ مستقیمِ فایلِ نصب (APK)',
};

/**
 * دیپ‌لینکِ اپِ فروشگاه؛ فقط روی نیتیو امتحان می‌شود تا مستقیم صفحه‌ی برنامه در خودِ
 * اپِ فروشگاه باز شود (به‌جای صفحه‌ی وب). اگر اپِ فروشگاه نصب نباشد، به `url` برمی‌گردیم.
 */
const METHOD_DEEP_LINK: Partial<Record<InstallMethodKey, string>> = {
  bazaar: `bazaar://details?id=${PKG}`,
  myket: `myket://details?id=${PKG}`,
};

/* eslint-disable @typescript-eslint/no-require-imports */
/** آرمِ برندِ هر فروشگاه؛ برای «دانلودِ مستقیم» لوگوی خودِ نودوست. */
const METHOD_LOGO: Record<InstallMethodKey, number> = {
  bazaar: require('../../../assets/logo/store-cafebazaar.png'),
  myket: require('../../../assets/logo/store-myket.png'),
  direct: require('../../../assets/logo/logo-mark-gold.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

async function openMethod(m: InstallMethod) {
  // روی نیتیو اول دیپ‌لینکِ اپِ فروشگاه را امتحان کن؛ روی وب یا نبودِ اپ، آدرسِ عادی.
  const deep = Platform.OS !== 'web' ? METHOD_DEEP_LINK[m.key] : undefined;
  if (deep) {
    try {
      if (await Linking.canOpenURL(deep)) {
        await Linking.openURL(deep);
        return;
      }
    } catch {
      /* fallback به url */
    }
  }
  Linking.openURL(m.url).catch(() => {
    /* آدرسِ نامعتبر یا مرورگرِ بدونِ اجازه — بی‌خیال */
  });
}

/**
 * فهرستِ روش‌های نصبِ اپِ اندروید (کافه‌بازار / مایکت / دانلودِ مستقیم). فقط روش‌هایی که
 * از پنلِ ادمین فعال شده و آدرس دارند به‌صورتِ کارتِ قابلِ‌لمس نشان داده می‌شوند.
 */
export function InstallMethods({ methods }: { methods: InstallMethod[] }) {
  if (methods.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          فعلاً روشِ نصبی تنظیم نشده است. کمی بعد دوباره سر بزن.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {methods.map((m) => (
        <Pressable
          key={m.key}
          onPress={() => openMethod(m)}
          accessibilityRole="button"
          accessibilityLabel={`${m.label} — ${METHOD_HINT[m.key] ?? ''}`}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.leadIcon}>
            <Image source={METHOD_LOGO[m.key]} style={styles.logo} contentFit="contain" />
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.hint}>{METHOD_HINT[m.key] ?? m.url}</Text>
          </View>
          <Icon name="chevron-prev" size={20} tint="gold" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, alignSelf: 'stretch' },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  leadIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 30, height: 30 },
  body: { flex: 1 },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  emptyBox: {
    alignSelf: 'stretch',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
