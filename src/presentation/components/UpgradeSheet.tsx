import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from './Button';
import { Icon } from './Icon';
import { TierBadge, tierName } from './TierBadge';
import { QuotaMeter } from './QuotaMeter';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { useTierCatalog } from '@/presentation/hooks/useTierCatalog';
import { tierPerks } from '@/presentation/tiers/tierFeatures';
import { QUOTA_META, resetText, unlockText } from '@/presentation/tiers/quotaCopy';
import { faPrice } from '@/core/utils/faNum';
import { quotaOf, type QuotaKey } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

/**
 * برگه‌ی ارتقا — تنها دروازه‌ی «چرا نمی‌توانم و چطور بازش کنم» در کلِ اپ.
 *
 * دو زمینه‌ی متفاوت را با یک زبانِ بصری می‌گوید:
 *   • سقفِ سهمیه پر شد  → نوارِ سهمیه + «کِی تازه می‌شود» + سطحی که سقف را برمی‌دارد
 *   • سطحِ حساب کم است  → سطحِ لازم + چیزهایی که با آن باز می‌شود
 *
 * سه تصمیمِ عمدی:
 *  ۱) برگه‌ی پایینی است نه پنجره‌ی وسطِ صفحه — کنارِ همان کاری می‌نشیند که قطع
 *     شده، دستِ کاربر به دکمه‌اش می‌رسد، و با کشیدن/زدنِ پس‌زمینه بسته می‌شود.
 *  ۲) خرید این‌جا انجام نمی‌شود. دکمه‌ی اصلی به ‎/plans?required&feature‎ می‌رود؛
 *     «یک سطحِ خرید در کلِ اپ» قاعده‌ای است که از قبل داشتیم و نگه داشته شده.
 *  ۳) اگر سرور بگوید هیچ سطحی این سهمیه را بالا نمی‌برد (unlockTier خالی)،
 *     اصلاً ارتقا پیشنهاد نمی‌شود — فقط زمانِ تازه‌شدن گفته می‌شود.
 */

const TRAVEL = 560;
const ENTER_SPRING = { damping: 22, stiffness: 200, mass: 0.9 } as const;

export interface UpgradeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** حالتِ سهمیه: کدام سقف پر شده. */
  quotaKey?: QuotaKey;
  /** حالتِ سطح: چه سطحی لازم است. */
  requiredTier?: number;
  /** جایگزینِ تیترِ پیش‌فرض. */
  title?: string;
  /** جایگزینِ متنِ پیش‌فرض. */
  message?: string;
  /** نامِ امکان برای بنرِ صفحه‌ی سطح‌ها. */
  feature?: string;
}

export function UpgradeSheet({
  visible,
  onClose,
  quotaKey,
  requiredTier,
  title,
  message,
  feature,
}: UpgradeSheetProps) {
  const insets = useSafeAreaInsets();
  const { quota } = useQuota();
  const { tiers } = useTierCatalog();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) progress.value = withSpring(1, ENTER_SPRING);
    else progress.value = 0;
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * TRAVEL }],
  }));

  const item = quotaKey ? quotaOf(quota, quotaKey) : undefined;

  // سطحِ هدف: صریحاً خواسته‌شده، وگرنه همان سطحی که سرور برای این سهمیه گفته.
  const targetLevel = requiredTier ?? item?.unlockTier;
  const target = tiers.find((t) => t.level === targetLevel);
  const perks = target ? tierPerks(target).slice(0, 3) : [];
  const meta = quotaKey ? QUOTA_META[quotaKey] : null;

  const heading =
    title ?? (meta ? meta.exhaustedTitle : `این امکان به سطحِ ${tierName(targetLevel ?? 2)} نیاز دارد`);

  const body = message ?? defaultBody();

  function defaultBody(): string {
    if (!meta) {
      return `برای این کار باید سطحِ حسابت دستِ‌کم ${tierName(targetLevel ?? 2)} باشد. پاسخ‌دادن به پیامِ دیگران همیشه رایگان است.`;
    }
    // سهمیه‌ی مادام‌العمر: «فردا تازه می‌شود» این‌جا دروغ است.
    if (item?.scope === 'lifetime') {
      return 'سهمِ رایگانِ حسابت یک‌بار است و تازه نمی‌شود. با ارتقای سطح دوباره باز می‌شود.';
    }
    // ممکن است هنوز سهمیه از سرور نرسیده باشد؛ متن نباید به آن وابسته بماند.
    const reset = item ? resetText(item, quota) : null;
    return `${reset ?? 'سهمیه‌ات فردا تازه می‌شود'}. اگر نمی‌خواهی صبر کنی، با ارتقای سطح سقفت بالا می‌رود.`;
  }

  const featureLabel = feature ?? meta?.feature;

  const goToPlans = () => {
    onClose();
    router.push({
      pathname: '/plans',
      params: {
        ...(targetLevel ? { required: String(targetLevel) } : {}),
        ...(featureLabel ? { feature: featureLabel } : {}),
      },
    });
  };

  const gain = item && target ? unlockText(item, target.name) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, shadow.card, { paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}
          accessibilityViewIsModal
        >
          <View style={styles.grabber} />

          <View style={styles.headRow}>
            <View style={styles.headIcon}>
              <Icon name={meta?.icon ?? 'lock'} size={20} tint="gold" />
            </View>
            <View style={styles.headText}>
              <Text style={styles.title}>{heading}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>

          {/* نوارِ سهمیه: کاربر باید *ببیند* چه چیزی تمام شده، نه فقط بخواند. */}
          {item ? (
            <View style={styles.meterBox}>
              <QuotaMeter item={item} quota={quota} />
            </View>
          ) : null}

          {/* کارتِ سطحِ هدف — نام، قیمت، و سه چیزی که واقعاً باز می‌کند. */}
          {target ? (
            <View style={styles.targetCard}>
              <View style={styles.targetHead}>
                <TierBadge tier={target.level} height={26} />
                {target.priceToman != null ? (
                  <Text style={styles.price}>{`${faPrice(target.priceToman)} تومان`}</Text>
                ) : null}
              </View>
              {gain ? (
                <View style={styles.gainRow}>
                  <Icon name="lightning-fill" size={14} tint="gold" />
                  <Text style={styles.gainText}>{gain}</Text>
                </View>
              ) : null}
              {perks.map((p, i) => (
                <View key={i} style={styles.perkRow}>
                  <Icon name="check" size={14} tint="gold" />
                  <Text style={styles.perkText}>{p}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            {/* اگر ارتقا این سهمیه را بالا نمی‌برد، دکمه‌ی خرید دروغ است — نشانش نده. */}
            {targetLevel ? (
              <Button
                label={target ? `دیدنِ ${target.name} و ارتقا` : 'دیدنِ سطح‌های اشتراک'}
                icon="diamond-fill"
                onPress={goToPlans}
                style={styles.btn}
              />
            ) : null}
            <Button
              label={targetLevel ? 'بعداً' : 'باشه'}
              variant={targetLevel ? 'outline' : 'gold'}
              onPress={onClose}
              style={styles.btn}
            />
          </View>

          {quotaKey === 'conversation' ? (
            <Text style={styles.note}>پاسخ‌دادن به کسی که به تو پیام داده همیشه رایگان است.</Text>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.backdrop },

  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.lg,
  },

  headRow: { flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'flex-start' },
  headIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  headText: { flex: 1, gap: spacing.xs },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  meterBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },

  targetCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  targetHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.gold2,
    writingDirection: 'rtl',
  },
  gainRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  gainText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  perkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  perkText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  actions: { marginTop: spacing.lg, gap: spacing.sm },
  btn: { width: '100%' },
  note: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
