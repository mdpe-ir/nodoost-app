import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '../PressableScale';
import { router, type Href } from 'expo-router';
import { Icon } from '@/presentation/components/Icon';
import { useInAppMessages } from '@/presentation/providers/InAppMessagesProvider';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
import { accentColor, messageIcon } from './accent';
import type { InAppMessage } from '@/domain/entities';

/**
 * اعلان‌های ادمین در بالای صفحه‌ی اعلان‌ها.
 *
 * چرا بالا و جدا از فید؟ چون فید «چه کسی با تو چه کرد» است و این‌ها «نودوست به
 * تو چه گفت»؛ قاطی‌کردنشان یعنی پیامِ مهمِ سیستمی زیرِ ده‌تا لایک گم می‌شود.
 */
export function InAppAlarmList() {
  const { alarms, markShown } = useInAppMessages();

  // ورودِ کاربر به صفحه‌ی اعلان‌ها = نمایشِ همه‌ی اعلان‌های واجد.
  useEffect(() => {
    alarms.forEach(markShown);
  }, [alarms, markShown]);

  if (alarms.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {alarms.map((m) => (
        <AlarmCard key={m.id} m={m} />
      ))}
    </View>
  );
}

function AlarmCard({ m }: { m: InAppMessage }) {
  const { dismiss, click } = useInAppMessages();
  const accent = accentColor(m.accent);

  const open = () => {
    click(m);
    // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
    router.push(`/message/${m.id}` as Href);
  };

  return (
    <PressableScale
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={m.title}
      scaleTo={0.98}
      feedback="select"
      style={[styles.card, { borderColor: accent }]}
    >
      <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
        <Icon name={messageIcon(m)} size={18} tint="gold" />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {m.title}
        </Text>
        {m.body ? (
          <Text style={styles.text} numberOfLines={2}>
            {m.body}
          </Text>
        ) : null}
        <Text style={[styles.more, { color: accent }]}>
          {m.ctaLabel || 'خواندنِ کامل'} ›
        </Text>
      </View>

      {m.dismissible ? (
        <PressableScale
          onPress={() => dismiss(m)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="بستنِ اعلان"
          scaleTo={0.85}
          feedback="select"
        >
          <Icon name="close" size={14} tint="ink" />
        </PressableScale>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface2,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  more: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'right',
    marginTop: 4,
  },
});
