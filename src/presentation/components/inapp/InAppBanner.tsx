import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Icon } from '@/presentation/components/Icon';
import { useInAppMessages } from '@/presentation/providers/InAppMessagesProvider';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';
import { accentColor, messageIcon } from './accent';
import { openTarget } from './openTarget';

/**
 * نوارِ سنجاق‌شده‌ی بالای صفحه‌ی خانه — کم‌آزارترین سطحِ پیام.
 *
 * اگر پیامی نباشد چیزی رندر نمی‌کند (نه فضای خالی، نه پرشِ چیدمان).
 */
export function InAppBanner() {
  const { banner, markShown, dismiss, click } = useInAppMessages();

  // ثبتِ نمایش وقتی واقعاً روی صفحه آمد، نه وقتی داده رسید.
  useEffect(() => {
    if (banner) markShown(banner);
  }, [banner, markShown]);

  if (!banner) return null;
  const accent = accentColor(banner.accent);

  const onPress = () => {
    if (!banner.ctaUrl) return;
    click(banner);
    openTarget(banner.ctaUrl);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      exiting={FadeOut.duration(160)}
      style={[styles.wrap, { borderColor: accent }]}
    >
      <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
        <Icon name={messageIcon(banner)} size={18} tint="gold" />
      </View>

      <Pressable
        style={styles.body}
        onPress={onPress}
        disabled={!banner.ctaUrl}
        accessibilityRole={banner.ctaUrl ? 'button' : undefined}
        accessibilityLabel={banner.title}
      >
        <Text style={styles.title} numberOfLines={1}>
          {banner.title}
        </Text>
        {banner.body ? (
          <Text style={styles.body_} numberOfLines={2}>
            {banner.body}
          </Text>
        ) : null}
        {banner.ctaLabel ? (
          <Text style={[styles.cta, { color: accent }]}>{banner.ctaLabel} ›</Text>
        ) : null}
      </Pressable>

      {banner.dismissible ? (
        <Pressable
          onPress={() => dismiss(banner)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="بستنِ پیام"
        >
          <Icon name="close" size={14} tint="ink" />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, alignItems: 'flex-end' },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body_: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    lineHeight: 20,
  },
  cta: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
});
