import React from 'react';
import { View, Text, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

/**
 * حالتِ رهای پس‌زمینه‌ی ردیف — همان `surface2` با آلفای صفر.
 * از `transparent` استفاده نمی‌کنیم چون میان‌یابیِ رنگ از آن‌جا از سیاه رد
 * می‌شود و ردیف موقعِ رهاشدن یک لحظه تیره می‌زند.
 */
const ROW_BG = 'rgba(30,24,38,0)';

/**
 * ردیف‌های فهرستِ تنظیمات — یک شکلِ واحد برای هر سه رفتاری که در اپ داریم:
 * رفتن به صفحه‌ی دیگر، روشن/خاموش‌کردنِ یک گزینه، و گزینه‌ای که به سطحِ اشتراک
 * نیاز دارد.
 *
 * چرا جدا شد: پیش‌تر همین سه رفتار در دلِ ProfileScreen و با استایل‌های
 * تکراری نوشته شده بودند و هر بار که یک ردیف اضافه می‌شد، شکلش کمی با بقیه فرق
 * می‌کرد. قفلِ سطح هم عمداً همین‌جاست: هر ردیفِ سطح‌دار، بدونِ سطحِ کافی، خودش
 * تبدیل به دعوتِ ارتقا می‌شود و هیچ صفحه‌ای لازم نیست این حالت را دوباره بنویسد.
 */

/** گزینه‌ای که به سطحِ اشتراک نیاز دارد. */
export interface TierRequirement {
  /** کمینه سطحِ لازم (۲ برنزی … ۵ الماس). */
  level: number;
  /** نامِ همان سطح برای متنِ دعوت. */
  name: string;
  onUpgrade: () => void;
}

/** قابِ یک گروهِ تنظیمات: عنوانِ کوچک + کارتِ ردیف‌ها با جداکننده‌ی خودکار. */
export function SettingsGroup({
  title,
  hint,
  highlight,
  children,
}: {
  title: string;
  hint?: string;
  /** قابِ طلایی — برای گروهی که می‌خواهیم در فهرست دیده شود (پشتیبانی). */
  highlight?: boolean;
  children: React.ReactNode;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.groupWrap}>
      <Text style={styles.groupTitle}>{title}</Text>
      {hint ? <Text style={styles.groupHint}>{hint}</Text> : null}
      <View style={[styles.group, highlight && styles.groupHighlight]}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

/** ردیفِ رفتنی — با شورون، و در صورتِ نیاز یک مقدارِ متنیِ فقط‌خواندنی. */
export function SettingsLink({
  icon,
  title,
  hint,
  value,
  onPress,
  tone = 'normal',
}: {
  icon: IconName;
  title: string;
  hint?: string;
  /** مقدارِ فقط‌خواندنی سمتِ چپ (مثلاً شماره‌ی موبایل). */
  value?: string;
  onPress?: () => void;
  tone?: 'normal' | 'gold' | 'danger';
}) {
  const body = (
    <>
      <View style={[styles.chip, tone === 'gold' && styles.chipGold, tone === 'danger' && styles.chipDanger]}>
        <Icon name={icon} size={18} tint="gold" />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, tone === 'danger' && styles.titleDanger]}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress ? <Icon name="chevron-prev" size={16} tint="gold" /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      // ردیفِ تمام‌عرض نباید محسوس کوچک شود؛ بازخوردِ اصلی روشن‌شدنِ پس‌زمینه
      // است — قراردادِ فهرست‌ها روی هر دو سکو.
      scaleTo={0.985}
      feedback="select"
      bg={ROW_BG}
      bgPressed={colors.surface2}
      style={styles.row}
    >
      {body}
    </PressableScale>
  );
}

/**
 * ردیفِ سوییچی. با `requires` و سطحِ ناکافی، خودش به یک ردیفِ قفل و دعوتِ ارتقا
 * تبدیل می‌شود — تا هیچ‌جا سوییچی که کار نمی‌کند نمایش داده نشود.
 */
export function SettingsToggle({
  icon,
  title,
  hint,
  value,
  saving,
  onChange,
  requires,
  userTier = 1,
}: {
  icon: IconName;
  title: string;
  hint: string;
  value: boolean;
  saving?: boolean;
  onChange: (v: boolean) => void;
  requires?: TierRequirement;
  userTier?: number;
}) {
  if (requires && userTier < requires.level) {
    return (
      <SettingsLink
        icon="lock"
        title={title}
        hint={`ویژه‌ی سطحِ ${requires.name} — برای فعال‌سازی ارتقا بده`}
        onPress={requires.onUpgrade}
        tone="gold"
      />
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Icon name={icon} size={18} tint="gold" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      {saving ? (
        // هم‌اندازه با Switch تا هنگامِ نمایشِ لودر چیدمان نپرد.
        <View style={styles.switchSlot}>
          <ActivityIndicator size="small" color={colors.gold} />
        </View>
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.line, true: colors.goldSoft }}
          thumbColor={value ? colors.gold : colors.ink3}
          accessibilityLabel={title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupWrap: { marginTop: spacing.xl },
  groupTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  groupHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  groupHighlight: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginHorizontal: spacing.lg },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  chip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGold: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  chipDanger: { backgroundColor: colors.roseFaint, borderWidth: 1, borderColor: colors.roseSoft },
  body: { flex: 1, alignItems: 'flex-end', gap: 2 },
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleDanger: { color: colors.rose },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
  switchSlot: { width: 51, height: 31, alignItems: 'center', justifyContent: 'center' },
});
