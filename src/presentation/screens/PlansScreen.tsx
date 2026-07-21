import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge, tierName } from '@/presentation/components/TierBadge';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { usePlansViewModel } from '@/presentation/hooks/usePlansViewModel';
import { tierPerks, tierFeatures, TIER_FEATURE_ROWS } from '@/presentation/tiers/tierFeatures';
import { faNum, faPrice } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';
import type { Tier } from '@/domain/entities';

/**
 * صفحه‌ی سطح‌های اشتراک — «با هر پلن چه چیزی باز می‌شود و چرا بخری».
 * دو بخش: کارتِ کاملِ هر پلن (امکانات + خرید) و جدولِ مقایسه‌ی همه‌ی سطح‌ها.
 * از ‎/api/tiers‎ تغذیه می‌شود؛ هیچ عددی ثابت‌کد نیست.
 *
 * زمینه‌ی قفل: با ‎/plans?required=<level>&feature=<نامِ امکان>‎ باز شود، بنرِ
 * «این امکان از سطحِ … باز می‌شود» را نشان می‌دهد، کارتِ همان سطح را برجسته
 * می‌کند و به آن اسکرول می‌کند — تنها سطحِ خرید در کلِ اپ همین‌جاست.
 */
export function PlansScreen() {
  const vm = usePlansViewModel();
  const user = vm.user;
  const userTier = user?.tier ?? 1;
  const isPlus = Boolean(user?.isPlus);

  const params = useLocalSearchParams<{ required?: string; feature?: string }>();
  const required = Number(params.required) || 0;
  const feature = typeof params.feature === 'string' && params.feature.trim() ? params.feature.trim() : null;
  const contextual = required > 0 || feature != null;

  // اسکرولِ خودکار به کارتِ سطحِ موردِ نیاز — مختصاتِ بخشِ کارت‌ها + کارتِ هدف.
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef(0);
  const scrolled = useRef(false);

  // به‌ترتیبِ سطح (کم به زیاد) تا کارت‌ها و ستون‌های جدول هم‌راستا باشند.
  const tiers = [...vm.tiers].sort((a, b) => a.level - b.level);

  return (
    <ScreenContainer flush>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.padded}>
          <ScreenHeader
            title="سطح‌های اشتراک"
            subtitle="با هر پلن چه چیزی برایت باز می‌شود"
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/discover'))}
          />
        </View>

        {vm.loading ? (
          <View style={styles.padded}>
            <RowsSkeleton count={4} />
          </View>
        ) : (
          <>
            <View
              style={styles.padded}
              onLayout={(e) => {
                sectionY.current = e.nativeEvent.layout.y;
              }}
            >
              {contextual ? (
                <View style={styles.contextBanner}>
                  <Icon name="lock" size={18} tint="gold" />
                  <Text style={styles.contextText}>
                    {`${feature ? `«${feature}»` : 'این امکان'} ${
                      required
                        ? `از سطحِ ${tierName(required)} به بالا باز می‌شود.`
                        : 'به سطحِ بالاتری نیاز دارد.'
                    } سطحِ فعلیِ تو ${isPlus ? tierName(userTier) : 'عادی (رایگان)'} است.`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.lead}>
                  {isPlus
                    ? `سطحِ فعلی‌ات ${tierName(userTier)} است. با ارتقا امکاناتِ بیشتری باز می‌شود.`
                    : 'الان سطحِ عادی (رایگان) داری. یکی از پلن‌ها را انتخاب کن تا امکاناتش باز شود.'}
                </Text>
              )}

              {tiers.map((t) => {
                const isTarget = required > 0 && t.level === required;
                return (
                  <View
                    key={t.id}
                    onLayout={
                      isTarget
                        ? (e) => {
                            if (scrolled.current) return;
                            scrolled.current = true;
                            const y = sectionY.current + e.nativeEvent.layout.y;
                            scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });
                          }
                        : undefined
                    }
                  >
                    <PlanCard
                      tier={t}
                      current={isPlus && t.level === userTier}
                      recommended={t.level > userTier}
                      highlight={isTarget}
                      purchasing={vm.purchasing === t.id}
                      onBuy={() => vm.buy(t.id, t.bazaarSku)}
                    />
                  </View>
                );
              })}
            </View>

            {tiers.length > 1 ? (
              <ComparisonTable tiers={tiers} userTier={userTier} />
            ) : null}

            <View style={styles.padded}>
              <View style={styles.note}>
                <Icon name="shield-check" size={18} tint="gold" />
                <Text style={styles.noteText}>
                  پاسخ‌دادن به پیامِ دیگران همیشه رایگان است؛ سطح فقط برای «شروعِ» گفتگو با سطح‌های بالاتر لازم است.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/** کارتِ کاملِ یک پلن: نام/قیمت/مدت + بولت‌های امکانات + دکمه‌ی خرید. */
function PlanCard({
  tier,
  current,
  recommended,
  highlight,
  purchasing,
  onBuy,
}: {
  tier: Tier;
  current: boolean;
  recommended: boolean;
  /** سطحِ موردِ نیازِ امکانِ قفل‌شده‌ای که کاربر را به این صفحه آورده. */
  highlight?: boolean;
  purchasing: boolean;
  onBuy: () => void;
}) {
  const perks = tierPerks(tier);
  return (
    <View
      style={[
        styles.card,
        current && styles.cardCurrent,
        recommended && styles.cardRec,
        highlight && styles.cardHighlight,
      ]}
    >
      {highlight ? (
        <View style={styles.highlightTag}>
          <Icon name="lock" size={12} tint="ink" />
          <Text style={styles.highlightTagText}>موردِ نیاز برای این امکان</Text>
        </View>
      ) : null}
      <View style={styles.cardHead}>
        <View style={styles.cardHeadRight}>
          <TierBadge tier={tier.level} height={26} />
          {tier.days ? <Text style={styles.days}>{faNum(tier.days)} روزه</Text> : null}
        </View>
        {current ? (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>پلنِ فعلی</Text>
          </View>
        ) : tier.priceToman != null ? (
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{faPrice(tier.priceToman)}</Text>
            <Text style={styles.priceUnit}>تومان</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.perks}>
        {perks.map((p, i) => (
          <View key={i} style={styles.perkRow}>
            <Icon name="check" size={15} tint="gold" />
            <Text style={styles.perkText}>{p}</Text>
          </View>
        ))}
      </View>

      {!current ? (
        <Button
          label={`خرید سطحِ ${tier.name}`}
          onPress={onBuy}
          loading={purchasing}
          icon="diamond-fill"
          style={styles.buy}
        />
      ) : (
        <View style={styles.currentBadgeRow}>
          <Icon name="check" size={18} tint="gold" />
          <Text style={styles.currentBadgeText}>همین حالا فعال است</Text>
        </View>
      )}
    </View>
  );
}

/** جدولِ مقایسه: ردیف = امکان، ستون = سطح. افقی اسکرول می‌شود اگر جا نشود. */
function ComparisonTable({ tiers, userTier }: { tiers: Tier[]; userTier: number }) {
  const cols = tiers.map((t) => ({ tier: t, feats: tierFeatures(t) }));
  // چیدمان راست‌به‌چپ است؛ ابتدای جدول (ستونِ عنوان + پایین‌ترین سطح) سمتِ راست
  // قرار می‌گیرد، پس در بازشدن باید به انتهای اسکرول (راست) برویم تا از راست شروع شود.
  const scrollRef = useRef<ScrollView>(null);
  return (
    <View style={styles.tableSection}>
      <Text style={styles.tableTitle}>مقایسه‌ی سطح‌ها</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableScroll}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View>
          {/* سرستون: نامِ سطح‌ها */}
          <View style={styles.tRow}>
            <View style={styles.tLabelCell} />
            {cols.map((c) => (
              <View
                key={c.tier.id}
                style={[styles.tHeadCell, c.tier.level === userTier && styles.tHeadCellCurrent]}
              >
                <TierBadge tier={c.tier.level} height={22} />
              </View>
            ))}
          </View>
          {TIER_FEATURE_ROWS.map((row, ri) => (
            <View key={row.key} style={[styles.tRow, ri % 2 === 1 && styles.tRowAlt]}>
              <View style={styles.tLabelCell}>
                <Icon name={row.icon} size={15} tint="gold" />
                <Text style={styles.tLabel} numberOfLines={2}>
                  {row.label}
                </Text>
              </View>
              {cols.map((c) => {
                const f = c.feats[ri];
                const isBool = f.value === 'دارد' || f.value === 'ندارد';
                return (
                  <View
                    key={c.tier.id}
                    style={[styles.tCell, c.tier.level === userTier && styles.tCellCurrent]}
                  >
                    {isBool ? (
                      f.enabled ? (
                        <Icon name="check" size={16} tint="gold" />
                      ) : (
                        <Text style={styles.tDash}>—</Text>
                      )
                    ) : (
                      <Text style={[styles.tValue, !f.enabled && styles.tValueDim]}>{f.value}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const LABEL_W = 132;
const CELL_W = 90;

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  padded: { paddingHorizontal: 18 },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },

  // — بنرِ زمینه‌ی قفل («این امکان از سطحِ … باز می‌شود») —
  contextBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    marginBottom: spacing.lg,
  },
  contextText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // — کارتِ پلن —
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardCurrent: { borderColor: colors.goldSoft, backgroundColor: colors.surface2 },
  cardRec: { borderColor: colors.goldSoft },
  cardHighlight: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  highlightTag: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.md,
  },
  highlightTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.bg, writingDirection: 'rtl' },
  cardHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeadRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  days: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, writingDirection: 'rtl' },
  priceWrap: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.gold2, writingDirection: 'rtl' },
  priceUnit: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, writingDirection: 'rtl' },
  currentTag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  currentTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.gold2 },

  perks: { gap: spacing.sm, marginBottom: spacing.lg },
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
  buy: {},
  currentBadgeRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  currentBadgeText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold, writingDirection: 'rtl' },

  // — جدولِ مقایسه —
  tableSection: { marginTop: spacing.lg, marginBottom: spacing.md },
  tableTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 18,
    marginBottom: spacing.md,
  },
  tableScroll: { paddingHorizontal: 18 },
  tRow: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  tRowAlt: { backgroundColor: colors.surface },
  tLabelCell: {
    width: LABEL_W,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tHeadCell: { width: CELL_W, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  tHeadCellCurrent: { backgroundColor: colors.goldFaint, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  tCell: { width: CELL_W, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  tCellCurrent: { backgroundColor: colors.goldFaint },
  tValue: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tValueDim: { color: colors.ink3 },
  tDash: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3 },

  // — یادداشتِ پایین —
  note: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: 20,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
