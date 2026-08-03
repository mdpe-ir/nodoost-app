import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Icon } from '@/presentation/components/Icon';
import { useInAppMessages } from '@/presentation/providers/InAppMessagesProvider';
import {
  accentColor,
  messageIcon,
  onAccentColor,
} from '@/presentation/components/inapp/accent';
import { openTarget } from '@/presentation/components/inapp/openTarget';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/**
 * صفحه‌ی تمام‌صفحه‌ی یک اعلانِ درون‌اپ — همان چیزی که با زدنِ روی کارتِ اعلان
 * باز می‌شود. متنِ بلندِ `fullBody` این‌جا خوانده می‌شود.
 *
 * پیام از حالتِ درون‌حافظه‌ی پرووایدر خوانده می‌شود، نه از یک درخواستِ تازه:
 * اعلانی که همین حالا رویش زده‌ای ممکن است دیگر «واجدِ شرایط» نباشد و یک
 * درخواستِ نو، صفحه‌ی خالی برمی‌گرداند.
 */
export function InAppMessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { byId, click, dismiss } = useInAppMessages();
  const message = byId(Number(id));

  if (!message) {
    return (
      <ScreenContainer>
        <StackHeader title="پیام" />
        <View style={styles.center}>
          <EmptyState
            icon="bell"
            title="این پیام دیگر در دسترس نیست"
            hint="شاید مهلتش تمام شده باشد."
            actionLabel="بازگشت"
            onAction={() => router.back()}
          />
        </View>
      </ScreenContainer>
    );
  }

  const accent = accentColor(message.accent);
  const onAccent = onAccentColor(message.accent);

  const go = (url?: string) => {
    click(message);
    openTarget(url);
  };

  return (
    <ScreenContainer>
      <StackHeader title="پیام" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {message.imageUrl ? (
          <Image source={{ uri: message.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
            <Icon name={messageIcon(message)} size={30} tint="gold" />
          </View>
        )}

        <Text style={styles.title}>{message.title}</Text>
        {message.fullBody ? <Text style={styles.body}>{message.fullBody}</Text> : null}

        <View style={styles.actions}>
          {message.ctaLabel ? (
            <Pressable
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={() => go(message.ctaUrl)}
              accessibilityRole="button"
              accessibilityLabel={message.ctaLabel}
            >
              <Text style={[styles.btnText, { color: onAccent }]}>{message.ctaLabel}</Text>
            </Pressable>
          ) : null}

          {message.secondaryLabel ? (
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => go(message.secondaryUrl)}
              accessibilityRole="button"
              accessibilityLabel={message.secondaryLabel}
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>
                {message.secondaryLabel}
              </Text>
            </Pressable>
          ) : null}

          {message.dismissible ? (
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => {
                dismiss(message);
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="خواندم"
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>خواندم</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  content: { paddingBottom: spacing.xxl },
  image: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  btn: { paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center' },
  btnGhost: { borderWidth: 1, borderColor: colors.line },
  btnText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, writingDirection: 'rtl' },
  btnGhostText: { color: colors.ink2 },
});
