import React, { useEffect } from 'react';
import { View, Text, Modal, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Icon } from '@/presentation/components/Icon';
import { useInAppMessages } from '@/presentation/providers/InAppMessagesProvider';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import { accentColor, messageIcon, onAccentColor } from './accent';
import { openTarget } from './openTarget';

/**
 * پنجره‌ی بازشو — پرمزاحمت‌ترین سطح، پس هم‌زمان فقط یکی.
 *
 * در ریشه‌ی اپ رندر می‌شود تا مستقل از صفحه‌ی جاری کار کند. پیامِ غیرِقابلِ‌بستن
 * دکمه‌ی «بستن» ندارد، ولی سرور تضمین می‌کند چنین پیامی حتماً دکمه‌ی اصلی دارد؛
 * وگرنه کاربر گیر می‌افتاد.
 */
export function InAppPopup() {
  const { popup, markShown, dismiss, click } = useInAppMessages();

  useEffect(() => {
    if (popup) markShown(popup);
  }, [popup, markShown]);

  if (!popup) return null;
  const accent = accentColor(popup.accent);
  const onAccent = onAccentColor(popup.accent);

  const close = () => dismiss(popup);
  const go = (url?: string) => {
    click(popup);
    dismiss(popup);
    openTarget(url);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={popup.dismissible ? close : undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {popup.imageUrl ? (
            <Image source={{ uri: popup.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
              <Icon name={messageIcon(popup)} size={26} tint="gold" />
            </View>
          )}

          <Text style={styles.title}>{popup.title}</Text>
          {popup.body ? (
            <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.body}>{popup.body}</Text>
            </ScrollView>
          ) : null}

          <View style={styles.actions}>
            {popup.ctaLabel ? (
              <Pressable
                style={[styles.btn, { backgroundColor: accent }]}
                onPress={() => go(popup.ctaUrl)}
                accessibilityRole="button"
                accessibilityLabel={popup.ctaLabel}
              >
                <Text style={[styles.btnText, { color: onAccent }]}>{popup.ctaLabel}</Text>
              </Pressable>
            ) : null}

            {popup.secondaryLabel ? (
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => go(popup.secondaryUrl)}
                accessibilityRole="button"
                accessibilityLabel={popup.secondaryLabel}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>{popup.secondaryLabel}</Text>
              </Pressable>
            ) : null}

            {popup.dismissible ? (
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="بستن"
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>بستن</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  image: {
    width: '100%',
    height: 148,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface2,
  },
  badge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  bodyScroll: { marginTop: spacing.sm, flexGrow: 0 },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  btnText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, writingDirection: 'rtl' },
  btnGhostText: { color: colors.ink2 },
});
