import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AnimatedNumber } from '@/presentation/components/AnimatedNumber';
import { PressableScale } from '@/presentation/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge, tierName, tierColor } from '@/presentation/components/TierBadge';
import { QuotaMeter } from '@/presentation/components/QuotaMeter';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { usePlansViewModel } from '@/presentation/hooks/usePlansViewModel';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import {
  tierPerks,
  tierFeatures,
  tierGains,
  freeTier,
  TIER_FEATURE_ROWS,
} from '@/presentation/tiers/tierFeatures';
import { queueSummary } from '@/presentation/tiers/subscriptionCopy';
import { faNum, faPrice } from '@/core/utils/faNum';
import { faJalali } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';
import type { Tier } from '@/domain/entities';

/**
 * صفحه‌ی سطح‌های اشتراک — تنها سطحِ خرید در کلِ اپ.
 *
 * بازطراحیِ ۲۰۲۶-۰۸ پاسخِ چهار سردرگمیِ پرتکرارِ کاربران است:
 *
 *  ۱) «نمی‌دانم اشتراکم را از کجا تمدید/ارتقا کنم» → کارتِ «وضعیتِ من» در بالای
 *     صفحه، با روزهای باقی‌مانده و صف؛ و ورودی‌های همیشه‌دیدنی از کاوش و پروفایل.
 *  ۲) «نمی‌فهمم سهمِ رایگانم تمام شده» → همان نوارهای سهمیه‌ای که در اپ می‌بیند،
 *     این‌جا هم بالای پلن‌ها تکرار می‌شوند؛ «چرا بخرم» با عددِ خودش گفته می‌شود.
 *  ۳) «جدولِ مقایسه را اصلاً نمی‌بینم» → جدول دیگر ته‌صفحه‌ی افقی‌اسکرول نیست:
 *     ستونِ عنوان ثابت است، فقط ستونِ سطح‌ها می‌لغزد، ستونِ «رایگان» هم دارد، و
 *     با یک دکمه‌ی صریح باز/بسته می‌شود.
 *  ۴) «نمی‌دانم هر پلن چه دارد» → به‌جای چهار کارتِ هم‌شکل، یک پلن در هر لحظه
 *     کامل نشان داده می‌شود، با «نسبت به سطحِ فعلی‌ات چه چیزی بهتر می‌شود».
 *
 * زمینه‌ی قفل: با ‎/plans?required=<level>&feature=<نامِ امکان>‎ باز شود، بنرِ
 * زمینه را نشان می‌دهد و همان سطح را از پیش انتخاب می‌کند.
 */
export function PlansScreen() {
  const vm = usePlansViewModel();
  const { quota } = useQuota();
  const { rules } = useRemoteConfig();
  const insets = useSafeAreaInsets();

  const user = vm.user;
  const userTier = user?.tier ?? 1;
  const isPlus = Boolean(user?.isPlus);

  const params = useLocalSearchParams<{ required?: string; feature?: string }>();
  const required = Number(params.required) || 0;
  const feature =
    typeof params.feature === 'string' && params.feature.trim() ? params.feature.trim() : null;
  const contextual = required > 0 || feature != null;

  // به‌ترتیبِ سطح (کم به زیاد) تا انتخابگر و ستون‌های جدول هم‌راستا باشند.
  const tiers = useMemo(() => [...vm.tiers].sort((a, b) => a.level - b.level), [vm.tiers]);
  const free = useMemo(() => freeTier(rules), [rules]);
  /** سطحِ فعلیِ کاربر به‌شکلِ Tier — مبنای «چه چیزی بهتر می‌شود». */
  const currentTier = useMemo(
    () => (isPlus ? (tiers.find((t) => t.level === userTier) ?? free) : free),
    [isPlus, tiers, userTier, free]
  );

  // انتخابِ پیش‌فرض *مشتق* می‌شود، نه با افکت ست: سطحِ خواسته‌شده‌ی قفل، وگرنه
  // اولین سطحِ بالاتر از سطحِ فعلی (طبیعی‌ترین قدمِ بعدی)، وگرنه بالاترین سطح.
  // با افکت، اولین رندر یک‌بار بدونِ انتخاب می‌رفت و کارت می‌پرید.
  const [touched, setTouched] = useState<number | null>(null);
  const picked =
    (touched != null ? tiers.find((t) => t.level === touched) : undefined) ??
    tiers.find((t) => t.level === required) ??
    tiers.find((t) => t.level > userTier) ??
    tiers[tiers.length - 1] ??
    null;
  const selected = picked?.level ?? null;

  const queueLine = queueSummary(tiers, user?.subscriptionQueue ?? []);
  // عمداً باز است. شکایتِ «جدولِ مقایسه را اصلاً نمی‌بینم» با بستنِ پیش‌فرض حل
  // نمی‌شود — فقط جای نامرئی‌بودنش عوض می‌شود. باز می‌ماند و کاربر می‌تواند
  // ببنددش؛ نه برعکس.
  const [compareOpen, setCompareOpen] = useState(true);

  return (
    <ScreenContainer flush>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 132 + insets.bottom }]}
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
            <View style={styles.padded}>
              {contextual ? (
                <View style={styles.contextBanner}>
                  <Icon name="lock" size={18} tint="gold" />
                  <Text style={styles.contextText}>
                    {`${feature ? `«${feature}»` : 'این امکان'} ${
                      required
                        ? `از سطحِ ${tierName(required)} به بالا باز می‌شود.`
                        : 'به سطحِ بالاتری نیاز دارد.'
                    }`}
                  </Text>
                </View>
              ) : null}

              <StatusCard
                isPlus={isPlus}
                tierLevel={userTier}
                until={user?.subscriptionUntil}
                queueLine={queueLine}
                quota={quota}
              />
            </View>

            {/* ── انتخابگرِ پلن ─────────────────────────────────────────────
                چهار کارتِ هم‌شکلِ پشتِ‌هم، کاربر را وادار می‌کرد چهار فهرستِ
                تقریباً یکسان را با هم بسنجد. یک انتخابگر + یک پلنِ کامل،
                همان کار را با بارِ ذهنیِ به‌مراتب کمتر انجام می‌دهد. */}
            <Text style={[styles.sectionTitle, styles.padded]}>پلن‌ت را انتخاب کن</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerRow}
            >
              {tiers.map((t) => (
                <PlanPill
                  key={t.id}
                  tier={t}
                  active={t.level === selected}
                  current={isPlus && t.level === userTier}
                  onPress={() => setTouched(t.level)}
                />
              ))}
            </ScrollView>

            {picked ? (
              <View style={styles.padded}>
                <PlanDetail
                  tier={picked}
                  current={currentTier}
                  isCurrent={isPlus && picked.level === userTier}
                  requiredHere={required > 0 && picked.level === required}
                />
              </View>
            ) : null}

            {/* ── مقایسه‌ی کامل ────────────────────────────────────────── */}
            {tiers.length > 1 ? (
              <View style={styles.padded}>
                <Disclosure
                  label="مقایسه‌ی همه‌ی سطح‌ها"
                  hint="جدولِ کاملِ امکانات، از رایگان تا الماس"
                  open={compareOpen}
                  onToggle={() => setCompareOpen((v) => !v)}
                />
              </View>
            ) : null}
            {compareOpen ? (
              <ComparisonTable tiers={[free, ...tiers]} userTier={isPlus ? userTier : 1} />
            ) : null}

            <View style={styles.padded}>
              <Faq />
            </View>
          </>
        )}
      </ScrollView>

      {/* ── نوارِ خریدِ چسبیده ────────────────────────────────────────────
          قیمت و دکمه همیشه در دسترسِ انگشت‌اند. «نمی‌دانم از کجا بخرم» تا حدِ
          زیادی همین بود: دکمه‌ی خرید ته‌ی یک اسکرولِ بلند گم می‌شد. */}
      {!vm.loading && picked ? (
        <BuyBar
          tier={picked}
          isCurrent={isPlus && picked.level === userTier}
          purchasing={vm.purchasing === picked.id}
          bottomInset={insets.bottom}
          onBuy={() => vm.buy(picked.id, picked.bazaarSku)}
        />
      ) : null}
    </ScreenContainer>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * کارتِ «وضعیتِ من» — اولین چیزی که کاربر می‌بیند.
 * برای مشترک: چه داری و تا کِی. برای رایگان: چقدر سهمیه مانده.
 * هدف این است که کاربر پیش از دیدنِ قیمت‌ها، *موقعیتِ خودش* را بفهمد.
 */
function StatusCard({
  isPlus,
  tierLevel,
  until,
  queueLine,
  quota,
}: {
  isPlus: boolean;
  tierLevel: number;
  until?: string;
  queueLine: string | null;
  quota: ReturnType<typeof useQuota>['quota'];
}) {
  const daysLeft = quota?.daysLeft ?? 0;
  const expiry = until ? faJalali(until, false) : null;

  return (
    <View style={[styles.status, isPlus && styles.statusPlus]}>
      <View style={styles.statusHead}>
        <View style={styles.statusHeadRight}>
          <Text style={styles.statusLabel}>سطحِ فعلیِ تو</Text>
          {isPlus ? (
            <TierBadge tier={tierLevel} height={24} />
          ) : (
            <View style={styles.freePill}>
              <Text style={styles.freePillText}>عادی · رایگان</Text>
            </View>
          )}
        </View>
        {isPlus && daysLeft > 0 ? (
          <View style={styles.daysPill}>
            <Icon name="clock" size={13} tint="gold" />
            <Text style={styles.daysPillText}>{`${faNum(daysLeft)} روز مانده`}</Text>
          </View>
        ) : null}
      </View>

      {isPlus && expiry ? (
        <Text style={styles.statusSub}>{`اعتبار تا ${expiry}`}</Text>
      ) : (
        <Text style={styles.statusSub}>
          با حسابِ رایگان هم می‌توانی بگردی، بپسندی و به پیام‌ها جواب بدهی.
        </Text>
      )}

      {queueLine ? (
        <View style={styles.queueRow}>
          <Icon name="clock" size={14} tint="gold" />
          <Text style={styles.queueText}>{queueLine}</Text>
        </View>
      ) : null}

      {/* سهمیه‌ی زنده — همان اعدادی که در کاوش و گفتگو می‌بیند. کنارِ قیمت‌ها
          نشستنشان، «چرا باید بخرم» را از یک ادعا به یک واقعیتِ قابلِ دیدن
          تبدیل می‌کند. */}
      {quota?.items.length ? (
        <View style={styles.statusQuota}>
          {quota.items.map((it) => (
            <QuotaMeter key={it.key} item={it} quota={quota} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** یک قرصِ انتخابِ پلن: نام + قیمت + نشانِ «فعلی». */
function PlanPill({
  tier,
  active,
  current,
  onPress,
}: {
  tier: Tier;
  active: boolean;
  current: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.9}
      feedback="select"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`پلنِ ${tier.name}`}
      style={[styles.pill, { borderColor: active ? tierColor(tier.level) : colors.line }, active && styles.pillActive]}
    >
      <View style={[styles.pillDot, { backgroundColor: tierColor(tier.level) }]} />
      <Text style={[styles.pillName, active && styles.pillNameActive]}>{tier.name}</Text>
      <Text style={styles.pillPrice}>
        {current ? 'فعلی' : tier.priceToman != null ? `${faPrice(tier.priceToman)} ت` : '—'}
      </Text>
    </PressableScale>
  );
}

/** پلنِ انتخاب‌شده، کامل: چه چیزی اضافه می‌شود، چه چیزهایی دارد. */
function PlanDetail({
  tier,
  current,
  isCurrent,
  requiredHere,
}: {
  tier: Tier;
  current: Tier;
  isCurrent: boolean;
  requiredHere: boolean;
}) {
  const gains = useMemo(() => tierGains(current, tier), [current, tier]);
  const perks = tierPerks(tier);
  const feats = tierFeatures(tier);
  const blocked = tier.purchasable === false && !isCurrent;

  return (
    <View style={[styles.detail, requiredHere && styles.detailRequired]}>
      {requiredHere ? (
        <View style={styles.reqTag}>
          <Icon name="lock" size={12} tint="ink" />
          <Text style={styles.reqTagText}>موردِ نیاز برای امکانی که خواستی</Text>
        </View>
      ) : null}

      <View style={styles.detailHead}>
        <View style={styles.detailHeadRight}>
          <TierBadge tier={tier.level} height={28} />
          {tier.days ? <Text style={styles.days}>{`${faNum(tier.days)} روزه`}</Text> : null}
        </View>
        {tier.priceToman != null ? (
          <View style={styles.priceWrap}>
            {/* با عوض‌کردنِ سطح، قیمت تا مقدارِ تازه بالا می‌رود. خودِ همین
                تغییر خبرِ صفحه است — پریدنِ عدد آن را بی‌صدا می‌کرد. */}
            <AnimatedNumber value={tier.priceToman} format="price" style={styles.price} />
            <Text style={styles.priceUnit}>تومان</Text>
          </View>
        ) : null}
      </View>

      {/* ── چه چیزی بهتر می‌شود ──
          قاب‌بندیِ تفاوتی: تنها بخشی که واقعاً به «چرا این پلن» جواب می‌دهد. */}
      {isCurrent ? (
        <View style={styles.currentNote}>
          <Icon name="check" size={16} tint="gold" />
          <Text style={styles.currentNoteText}>این سطح همین حالا برایت فعال است.</Text>
        </View>
      ) : gains.length ? (
        <View style={styles.gains}>
          <Text style={styles.gainsTitle}>نسبت به سطحِ فعلی‌ات چه چیزی بهتر می‌شود</Text>
          {gains.map((g) => (
            <View key={g.key} style={styles.gainRow}>
              <Icon name={g.icon} size={15} tint="gold" />
              <Text style={styles.gainLabel}>{g.label}</Text>
              <View style={styles.gainValues}>
                <Text style={styles.gainFrom}>{g.from}</Text>
                {/* راست‌به‌چپ: پیشرفت به سمتِ چپ می‌رود. */}
                <Text style={styles.gainArrow}>←</Text>
                <Text style={styles.gainTo}>{g.to}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.currentNote}>
          <Icon name="shield" size={16} tint="gold" />
          <Text style={styles.currentNoteText}>
            این سطح چیزی بیشتر از سطحِ فعلیِ تو ندارد.
          </Text>
        </View>
      )}

      {/* بولت‌های دستیِ PM (اگر تعریف شده باشند) — زبانِ بازاریابی، نه عدد. */}
      {perks.length ? (
        <View style={styles.perks}>
          {perks.map((p, i) => (
            <View key={i} style={styles.perkRow}>
              <Icon name="check" size={14} tint="gold" />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* فهرستِ کاملِ امکاناتِ همین سطح — دیگر لازم نیست کاربر جدولِ مقایسه را
          پیدا کند تا بفهمد «این پلن دقیقاً چه دارد». */}
      <View style={styles.featBox}>
        <Text style={styles.featTitle}>{`همه‌ی امکاناتِ ${tier.name}`}</Text>
        {feats.map((f) => (
          <View key={f.key} style={styles.featRow}>
            <View style={styles.featLabelWrap}>
              <Icon name={f.icon} size={14} tint="gold" />
              <Text style={styles.featLabel}>{f.label}</Text>
            </View>
            <Text style={[styles.featValue, !f.enabled && styles.featValueOff]}>{f.value}</Text>
          </View>
        ))}
      </View>

      {blocked ? (
        <View style={styles.blocked}>
          <Icon name="lock" size={16} tint="ink" />
          <View style={styles.blockedTexts}>
            <Text style={styles.blockedText}>
              {tier.blockMessage || 'با اشتراکِ فعالِ شما، این سطح قابلِ خرید نیست.'}
            </Text>
            {tier.queuedDaysLeft ? (
              <Text style={styles.blockedQueue}>
                {`${faNum(tier.queuedDaysLeft)} روز از این سطح در صفِ توست و پس از پایانِ اشتراکِ فعلی شروع می‌شود.`}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** نوارِ خریدِ چسبیده به پایینِ صفحه. */
function BuyBar({
  tier,
  isCurrent,
  purchasing,
  bottomInset,
  onBuy,
}: {
  tier: Tier;
  isCurrent: boolean;
  purchasing: boolean;
  bottomInset: number;
  onBuy: () => void;
}) {
  const blocked = tier.purchasable === false && !isCurrent;
  return (
    <View style={[styles.buyBar, shadow.card, { paddingBottom: bottomInset + spacing.md }]}>
      <View style={styles.buyInfo}>
        <Text style={styles.buyName}>{tier.name}</Text>
        <Text style={styles.buyPrice}>
          {tier.priceToman != null
            ? `${faPrice(tier.priceToman)} تومان${tier.days ? ` · ${faNum(tier.days)} روز` : ''}`
            : '—'}
        </Text>
      </View>
      {isCurrent ? (
        <View style={styles.buyCurrent}>
          <Icon name="check" size={16} tint="gold" />
          <Text style={styles.buyCurrentText}>فعال</Text>
        </View>
      ) : (
        <Button
          label={blocked ? 'فعلاً قابلِ خرید نیست' : `خریدِ ${tier.name}`}
          icon={blocked ? 'lock' : 'diamond-fill'}
          onPress={onBuy}
          loading={purchasing}
          disabled={blocked}
          style={styles.buyBtn}
        />
      )}
    </View>
  );
}

/** سرِ بازشو — دکمه‌ی صریحِ باز/بستن با فلشِ چرخان. */
function Disclosure({
  label,
  hint,
  open,
  onToggle,
}: {
  label: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.98}
      feedback="select"
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={[styles.disc, open && styles.discOpen]}
    >
      <View style={styles.discTexts}>
        <Text style={styles.discLabel}>{label}</Text>
        {hint ? <Text style={styles.discHint}>{hint}</Text> : null}
      </View>
      {/* ستِ آیکنِ برند فلشِ رو‌به‌پایین ندارد؛ مثلثِ ترسیمی همان کار را می‌کند. */}
      <View style={[styles.caret, open && styles.caretOpen]} />
    </PressableScale>
  );
}

/**
 * جدولِ مقایسه — ستونِ عنوان *بیرونِ* اسکرولِ افقی است.
 *
 * پیش از این کلِ جدول (با عنوان‌ها) افقی می‌لغزید، پس با یک لغزشِ کوچک
 * عنوانِ ردیف‌ها از صفحه بیرون می‌رفت و اعداد بی‌معنا می‌شدند — دلیلِ اصلیِ
 * «جدول را نمی‌بینم/نمی‌فهمم». حالا عنوان ثابت است و فقط سطح‌ها می‌لغزند.
 */
function ComparisonTable({ tiers, userTier }: { tiers: Tier[]; userTier: number }) {
  const cols = tiers.map((t) => ({ tier: t, feats: tierFeatures(t) }));
  const scrollRef = useRef<ScrollView>(null);
  return (
    <View style={styles.tableSection}>
      <View style={styles.tableHint}>
        <Text style={styles.tableHintText}>برای دیدنِ سطح‌های بیشتر، جدول را بکش</Text>
        <Icon name="next-arrows" size={14} tint="gold" />
      </View>

      <View style={styles.tableWrap}>
        {/* ستونِ ثابتِ عنوان */}
        <View style={styles.tFixed}>
          <View style={[styles.tHeadCell, styles.tLabelHead]} />
          {TIER_FEATURE_ROWS.map((row, ri) => (
            <View key={row.key} style={[styles.tLabelCell, ri % 2 === 1 && styles.tRowAlt]}>
              <Icon name={row.icon} size={14} tint="gold" />
              <Text style={styles.tLabel} numberOfLines={2}>
                {row.label}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          // چیدمان راست‌به‌چپ است: جدول باید از راست (پایین‌ترین سطح) شروع شود.
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View>
            <View style={styles.tRow}>
              {cols.map((c) => (
                <View
                  key={c.tier.id}
                  style={[styles.tHeadCell, c.tier.level === userTier && styles.tCellCurrent]}
                >
                  <TierBadge tier={c.tier.level} height={22} />
                  {c.tier.level === userTier ? (
                    <Text style={styles.tCurrentTag}>سطحِ تو</Text>
                  ) : null}
                </View>
              ))}
            </View>
            {TIER_FEATURE_ROWS.map((row, ri) => (
              <View key={row.key} style={[styles.tRow, ri % 2 === 1 && styles.tRowAlt]}>
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
                        <Text style={[styles.tValue, !f.enabled && styles.tValueDim]}>
                          {f.value}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * پرسش‌های پرتکرار — هر مورد یکی از سوءتفاهم‌هایی است که واقعاً در پشتیبانی
 * دیده شد. جای این متن‌ها این‌جاست، نه در ذهنِ تیمِ پشتیبانی.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'اشتراکم را چطور تمدید یا ارتقا بدهم؟',
    a: 'از همین صفحه. پلنِ موردِ نظرت را انتخاب کن و دکمه‌ی خرید را در پایینِ صفحه بزن. به این صفحه از پروفایل («عضویت») یا از هر جایی که با پیامِ قفل روبه‌رو شوی می‌رسی.',
  },
  {
    q: 'اگر وسطِ اشتراک ارتقا بدهم، روزهای باقی‌مانده‌ام می‌سوزد؟',
    a: 'نه. سطحِ جدید از همان لحظه فعال می‌شود و روزهای باقی‌مانده‌ی اشتراکِ قبلی در صف می‌مانند و بعد از پایانِ سطحِ جدید ادامه پیدا می‌کنند.',
  },
  {
    q: 'با حسابِ رایگان چه کارهایی می‌توانم بکنم؟',
    a: 'گشتن، دیدنِ پروفایل‌ها، پسندکردن (تا سقفِ روزانه)، چتِ شانسی (تا سقفِ روزانه) و پاسخ‌دادن به هر کسی که به تو پیام داده. فقط «شروعِ گفتگو» سهمِ محدود دارد.',
  },
  {
    q: 'پاسخ‌دادن به پیام‌ها هم سهمیه دارد؟',
    a: 'نه. پاسخ‌دادن به کسی که به تو پیام داده همیشه و برای همه‌ی سطح‌ها رایگان است. سهمیه فقط برای شروعِ گفتگوی تازه از سمتِ توست.',
  },
  {
    q: 'سهمیه‌ی روزانه کِی تازه می‌شود؟',
    a: 'نیمه‌شب به وقتِ تهران. سهمِ «شروعِ گفتگو»ی حسابِ رایگان استثناست: یک‌بار برای همیشه است و با گذشتِ روز برنمی‌گردد.',
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={styles.faq}>
      <Text style={styles.sectionTitle}>سؤال‌های پرتکرار</Text>
      {FAQ.map((f, i) => (
        <View key={i} style={styles.faqItem}>
          <Disclosure label={f.q} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          {open === i ? <Text style={styles.faqAnswer}>{f.a}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const CELL_W = 96;
const LABEL_W = 128;

const styles = StyleSheet.create({
  scroll: {},
  padded: { paddingHorizontal: 18 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // — بنرِ زمینه‌ی قفل —
  contextBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    marginBottom: spacing.md,
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

  // — کارتِ وضعیتِ من —
  status: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  statusPlus: { borderColor: colors.goldSoft, backgroundColor: colors.surface2 },
  statusHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusHeadRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  statusLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  freePill: {
    paddingHorizontal: spacing.md,
    height: 24,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
  },
  freePillText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink2 },
  daysPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  daysPillText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  statusSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  queueRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  queueText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusQuota: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: spacing.md,
  },

  // — انتخابگرِ پلن —
  pickerRow: { paddingHorizontal: 18, gap: spacing.sm, flexDirection: 'row-reverse' },
  pill: {
    minWidth: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  pillActive: { backgroundColor: colors.surface2 },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillName: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
  pillNameActive: { color: colors.ink, fontFamily: fonts.bold },
  pillPrice: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },

  // — پلنِ انتخاب‌شده —
  detail: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  detailRequired: { borderColor: colors.gold },
  reqTag: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  reqTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.bg, writingDirection: 'rtl' },
  detailHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailHeadRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  days: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  priceWrap: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4 },
  price: {
    fontFamily: fonts.bold,
    // پله‌ی نمایشی: قیمت مهم‌ترین عددِ این صفحه است و باید مثلِ عنوان دیده شود،
    // نه هم‌وزنِ برچسبِ کنارش.
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    color: colors.gold2,
    writingDirection: 'rtl',
  },
  priceUnit: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },

  gains: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  gainsTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  gainRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  gainLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  gainValues: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  gainFrom: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textDecorationLine: 'line-through',
    writingDirection: 'rtl',
  },
  gainArrow: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
  gainTo: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.gold2,
    writingDirection: 'rtl',
  },

  currentNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
  },
  currentNoteText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  perks: { gap: spacing.sm },
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

  featBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  featTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: spacing.sm,
  },
  featRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  featLabelWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 },
  featLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  featValue: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  featValueOff: { color: colors.ink3 },

  blocked: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  blockedTexts: { flex: 1, gap: 4 },
  blockedText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  blockedQueue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // — نوارِ خرید —
  buyBar: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 18,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  buyInfo: { alignItems: 'flex-end' },
  buyName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  buyPrice: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
  buyBtn: { flex: 1 },
  buyCurrent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  buyCurrentText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },

  // — بازشوها —
  disc: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
  },
  discOpen: { borderColor: colors.goldSoft },
  discTexts: { flex: 1, gap: 2 },
  discLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  discHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.gold,
  },
  caretOpen: { transform: [{ rotate: '180deg' }] },

  // — جدولِ مقایسه —
  tableSection: { marginTop: spacing.md },
  tableHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: spacing.sm,
  },
  tableHintText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  tableWrap: { flexDirection: 'row-reverse', paddingHorizontal: 18 },
  tFixed: { width: LABEL_W, backgroundColor: colors.bg },
  tRow: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  tRowAlt: { backgroundColor: colors.surface },
  tLabelHead: { width: LABEL_W },
  tLabelCell: {
    width: LABEL_W,
    height: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  tLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: 17,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tHeadCell: {
    width: CELL_W,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tCurrentTag: { fontFamily: fonts.medium, fontSize: 9, color: colors.gold2 },
  tCell: { width: CELL_W, height: 54, alignItems: 'center', justifyContent: 'center' },
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

  // — پرسش‌های پرتکرار —
  faq: { marginTop: spacing.lg },
  faqItem: {},
  faqAnswer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
