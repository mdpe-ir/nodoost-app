import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button } from '@/presentation/components/Button';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { useWelcome } from '@/presentation/providers/WelcomeProvider';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, gradients, shadow } from '@/core/theme';

interface Slide {
  icon: IconName;
  tag: string;
  title: string;
  body: string;
}

/** روایتِ معرفیِ نودوست — از «این‌جا کجاست؟» تا معرفیِ هر امکان. */
const SLIDES: Slide[] = [
  {
    icon: 'heart-fill',
    tag: 'آشنایی از نو',
    title: 'به نودوست خوش اومدی',
    body: 'نزدیک‌ترین آدم‌ها به تو، همین‌جان. آشناییِ واقعی، امن و بی‌دردسر — بذار نشونت بدیم چطور.',
  },
  {
    icon: 'tab-discover',
    tag: 'کاوش',
    title: 'ورق بزن و لایک کن',
    body: 'پروفایل‌ها رو یکی‌یکی ببین؛ هرکی رو پسندیدی لایک کن. اگه لایک دوطرفه بشه، مَچ می‌شید و گفت‌وگو شروع می‌شه.',
  },
  {
    icon: 'map',
    tag: 'اطرافِ تو',
    title: 'آدم‌های نزدیکت',
    body: 'روی نقشه و در شبکه‌ی اطراف ببین چه کسانی دور و برت هستن و چقدر فاصله دارید — آشنایی از همین نزدیکی.',
  },
  {
    icon: 'lightning-fill',
    tag: 'شانسی',
    title: 'آشناییِ تصادفی',
    body: 'دکمه‌ی طلاییِ وسط رو بزن تا یک نفرِ کاملاً تصادفی جلوت ظاهر بشه. هیجانِ یک آشناییِ غیرمنتظره!',
  },
  {
    icon: 'tab-chat',
    tag: 'گفت‌وگو',
    title: 'حرف بزن، امن بمون',
    body: 'با مچ‌هات چت کن یا مستقیم از پروفایلِ هرکس بهش پیام بده. پروفایل‌های تأییدشده، تجربه‌ای مطمئن‌تر می‌سازن.',
  },
];

export function WelcomeScreen() {
  const { markSeen } = useWelcome();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const last = SLIDES.length - 1;
  const isLast = index >= last;

  // کاروسل راست‌به‌چپ است: اسلایدِ اول در راست می‌نشیند و برای «بعدی» به راست می‌کشی.
  // چون ریشه‌ی وب/نیتیو LTR است، اسلایدها را برعکس می‌چینیم و مکانِ اسکرول را به
  // «شماره‌ی منطقی» نگاشت می‌کنیم؛ اسلایدِ i در آفستِ (last - i) قرار می‌گیرد.
  const reversed = useMemo(() => SLIDES.map((s, i) => ({ s, i })).reverse(), []);
  const offsetFor = (i: number) => (last - i) * width;

  // در آغاز (و هنگامِ تغییرِ عرض روی وب) به اسلایدِ جاری برو — با useLayoutEffect
  // تا پیش از رنگ‌آمیزی جابه‌جا شود و پرشِ اسلایدِ آخر دیده نشود.
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ x: offsetFor(index), animated: false });
    // فقط به عرض وابسته است؛ حرکتِ آگاهانه از goTo انجام می‌شود، نه این افکت.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const pos = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    const logical = last - pos;
    if (logical !== index) setIndex(logical);
  }

  function goTo(i: number) {
    const clamped = Math.max(0, Math.min(last, i));
    scrollRef.current?.scrollTo({ x: offsetFor(clamped), animated: true });
    setIndex(clamped);
  }

  function next() {
    if (isLast) markSeen();
    else goTo(index + 1);
  }

  function prev() {
    if (index > 0) goTo(index - 1);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* هاله‌ی طلاییِ پس‌زمینه — عمق و حالِ لوکسِ برند */}
      <LinearGradient
        colors={[colors.goldFaint, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.glow}
        pointerEvents="none"
      />

      {/* سطرِ بالا: نامِ برند + رد کردن */}
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable
            onPress={markSeen}
            hitSlop={10}
            style={({ pressed }) => pressed && styles.pressedDim}
            accessibilityRole="button"
            accessibilityLabel="رد کردنِ معرفی"
          >
            <Text style={styles.skip}>رد کردن</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={styles.brand}>نودوست</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        // انگشت را به بالا/پایینِ لغزشِ افقی حساس نکن تا سوایپ روی موبایل روان باشد
        directionalLockEnabled
        disableIntervalMomentum
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {reversed.map(({ s, i }) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Animated.View entering={FadeIn.duration(320)} style={styles.hero}>
              <LinearGradient
                colors={gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroRing}
              >
                <View style={styles.heroInner}>
                  <Icon name={s.icon} size={64} tint="gold" />
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(340).delay(60)} style={styles.copy}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{s.tag}</Text>
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* نقطه‌های پیشرفت — راست‌به‌چپ، هم‌جهت با خواندنِ فارسی */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={8} accessibilityRole="button">
            <View style={[styles.dot, i === index && styles.dotOn]} />
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        {/* «بعدی» تمام‌عرض در بالا، «قبلی» به‌صورتِ دکمه‌ی متنی در پایین */}
        <Button
          label={isLast ? 'بزن بریم' : 'بعدی'}
          onPress={next}
          icon={isLast ? undefined : 'chevron-prev'}
          style={styles.nextBtn}
        />
        {index > 0 ? (
          <Pressable
            onPress={prev}
            hitSlop={8}
            style={({ pressed }) => [styles.prevBtn, pressed && styles.pressedDim]}
            accessibilityRole="button"
            accessibilityLabel="اسلایدِ قبلی"
          >
            <Text style={styles.prevText}>قبلی</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const HERO = 176;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  topBar: {
    // ریشه‌ی وب عمداً LTR است؛ «رد کردن» در چپ و نامِ برند در راست می‌نشیند.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 44,
  },
  brand: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.gold2 },
  skip: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink3 },
  pressedDim: { opacity: 0.6 },
  // pager کلِ فضای میانی را می‌گیرد تا کلِ این ناحیه هدفِ سوایپ باشد، نه فقط نوارِ محتوا
  pager: { flex: 1 },
  // alignItems:center محتوای هر اسلاید را به‌صورتِ عمودی وسطِ قابِ بلندِ pager می‌چیند
  pagerContent: { alignItems: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  hero: { marginBottom: spacing.xxl },
  heroRing: {
    width: HERO,
    height: HERO,
    borderRadius: HERO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.gold,
  },
  heroInner: {
    width: HERO - 14,
    height: HERO - 14,
    borderRadius: (HERO - 14) / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center' },
  tag: {
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.lg,
  },
  tagText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md + 3,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.md,
    maxWidth: 360,
  },
  dots: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.surface2 },
  dotOn: { width: 22, backgroundColor: colors.gold },
  footer: { paddingHorizontal: 22, paddingBottom: spacing.lg },
  nextBtn: { width: '100%' },
  prevBtn: { alignSelf: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  prevText: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink3 },
});
