import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import { haptics, hapticCommit, hapticThreshold } from '@/core/haptics';
import {
  colors,
  fonts,
  fontSizes,
  gradients,
  lineHeights,
  radius,
  shadow,
  spacing,
  springs,
} from '@/core/theme';
import { TierBadge } from './TierBadge';
import { Scrim } from './Scrim';
import { Icon } from './Icon';
import type { Candidate } from '@/domain/entities';

const { width } = Dimensions.get('window');

/** جابه‌جاییِ لازم برای قطعی‌شدنِ تصمیم با رهاکردن. */
const THRESHOLD = width * 0.26;
/** سرعتی که حتی زیرِ آستانه هم کارت را پرت می‌کند — یک تکانِ سریع کافی است. */
const FLING_VELOCITY = 800;
/** بیشترین زاویه‌ی چرخش در انتهای کشیدن. */
const MAX_ROTATION = 11;
/** مدتِ پروازِ کارت به بیرونِ قاب. */
const FLIGHT = 240;

export interface SwipeCardHandle {
  swipe: (dir: 'like' | 'pass') => void;
}

interface Props {
  candidate: Candidate;
  onSwipe: (dir: 'like' | 'pass') => void;
  /** تک‌ضربه روی کارت → بازکردنِ پروفایلِ کامل (که پیام و پسند آن‌جاست). */
  onOpenProfile?: () => void;
  /**
   * پیشرفتِ کشیدن، بازه‌ی ‎−۱ تا ۱ (منفی = رد، مثبت = پسند). کارت آن را
   * می‌نویسد و دسته‌ی پشتِ سر می‌خواندش تا هم‌زمان با انگشت بالا بیاید.
   */
  progress?: SharedValue<number>;
  /** برچسبِ علاقه‌مندی‌هایی که با کاربر مشترک است — روی کارت طلایی می‌شوند. */
  sharedInterests?: string[];
}

/**
 * کارتِ سواایپ.
 *
 * روی Reanimated + gesture-handler است، یعنی کلِ کشیدن روی تردِ UI اجرا می‌شود
 * و هیچ فریمی منتظرِ جاوااسکریپت نمی‌ماند. (نسخه‌ی قبلی روی PanResponder با
 * `useNativeDriver: false` بود؛ هر فریمِ کشیدن از پلِ JS رد می‌شد.)
 *
 * سه چیز است که کارت را از «عکسی که سُر می‌خورد» به «جسمی که در دست داری»
 * تبدیل می‌کند، و هر سه اینجا هست:
 *
 * ۱) محورِ چرخش. کارت حولِ نقطه‌ای می‌چرخد که گرفته‌ای: از بالا بگیری و به
 *    راست بکشی، ساعت‌گرد می‌چرخد؛ از پایین بگیری، پادساعت‌گرد. چرخشِ ثابت
 *    حولِ مرکز، حسِ «تصویرِ متحرک» می‌دهد نه «کاغذ روی میز».
 * ۲) سرعت. یک تکانِ سریعِ کوتاه باید کارت را بیندازد، حتی اگر از آستانه رد
 *    نشده باشد — چون در دنیای واقعی تکانه هست، فقط جابه‌جایی نیست.
 * ۳) نور. کارت در جهتِ تصمیم نور می‌گیرد (طلایی برای پسند، رز برای رد) پیش از
 *    آنکه تمبر خوانا شود، پس دست پیش از چشم می‌فهمد کجاست.
 *
 * جهتِ ژست عمداً قراردادِ جهانیِ اپ‌های دوست‌یابی است: راست = پسند، چپ = رد.
 */
export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { candidate, onSwipe, onOpenProfile, progress, sharedInterests },
  ref
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  /** ‎+۱ اگر کارت را از نیمه‌ی بالا گرفته‌ای، ‎−۱ اگر از نیمه‌ی پایین. */
  const pivot = useSharedValue(1);
  /** کارت در دست است — برای بالا آمدن و سایه‌ی بلندتر. */
  const held = useSharedValue(0);
  /** آخرین سمتی که از آستانه رد شده — تا لرزش فقط یک‌بار در هر عبور بزند. */
  const crossed = useSharedValue(0);
  /** ارتفاعِ واقعیِ کارت — برای تشخیصِ اینکه از بالا گرفته‌ای یا از پایین. */
  const cardH = useSharedValue(0);
  /** عرضِ واقعیِ کارت — مرزِ ناحیه‌ی لمسِ عکسِ بعدی/قبلی. */
  const cardW = useSharedValue(width);

  /**
   * عکس‌های کارت. سرورهای قدیمی‌تر `photoUrls` نمی‌فرستند؛ مَپر در آن حالت
   * آرایه‌ی یک‌تایی از همان عکسِ اصلی می‌سازد، پس اینجا فقط یک مسیر داریم.
   */
  const photos = useMemo(() => {
    const list = (candidate.photoUrls ?? []).map(mediaUrl).filter(Boolean) as string[];
    if (list.length) return list;
    const single = mediaUrl(candidate.photoUrl);
    return single ? [single] : [];
  }, [candidate.photoUrls, candidate.photoUrl]);
  const photoCount = photos.length;
  const [photoIndex, setPhotoIndex] = useState(0);

  /** جابه‌جایی در نوارِ عکس؛ در دو سرِ نوار متوقف می‌شود، نه اینکه دور بزند. */
  const step = useCallback(
    (dir: 1 | -1) => {
      setPhotoIndex((i) => {
        const next = Math.min(photoCount - 1, Math.max(0, i + dir));
        // لرزش فقط وقتی واقعاً چیزی عوض شد — رسیدن به تهِ نوار باید سکوت باشد.
        if (next !== i) haptics.select();
        return next;
      });
    },
    [photoCount]
  );

  const finish = (dir: 'like' | 'pass') => {
    'worklet';
    const toX = dir === 'like' ? width * 1.5 : -width * 1.5;
    // لرزش در لحظه‌ی تصمیم است نه پایانِ پرواز — تصمیم همین‌جا گرفته شد.
    runOnJS(hapticCommit)();
    x.value = withTiming(toX, { duration: FLIGHT }, (done) => {
      if (!done) return;
      // ویومدل تازه اینجا خبردار می‌شود. اگر بالاتر صدایش بزنیم، `vm.current`
      // بلافاصله عوض می‌شود، کارت با کلیدِ جدید از نو mount می‌شود و پروازش
      // هیچ‌وقت دیده نمی‌شود — دقیقاً همان «ناپدید شدنِ» بی‌حسِ قبلی.
      //
      // خالی‌بودنِ پشتِ سر مسئله نیست: دسته همین حالا هم‌زمان با انگشت بالا
      // آمده و کارتِ بعدی سرِ جای این نشسته، پس فاصله‌ای دیده نمی‌شود.
      if (progress) progress.value = 0;
      runOnJS(onSwipe)(dir);
    });
  };

  useImperativeHandle(ref, () => ({
    swipe: (dir) => {
      // پرتاب با دکمه: کارت باید همان مسیرِ کشیدن را طی کند، نه فقط ناپدید
      // شود — وگرنه دکمه و ژست دو کنشِ متفاوت حس می‌شوند.
      pivot.value = 1;
      y.value = withTiming(-40, { duration: FLIGHT });
      finish(dir);
    },
  }));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => {
          // نیمه‌ی بالا → ساعت‌گرد، نیمه‌ی پایین → پادساعت‌گرد. تا اندازه‌ی
          // واقعی نرسیده، بالا فرض می‌شود.
          pivot.value = cardH.value > 0 && e.y > cardH.value / 2 ? -1 : 1;
          held.value = withSpring(1, springs.snappy);
        })
        .onUpdate((e) => {
          x.value = e.translationX;
          y.value = e.translationY;
          const p = Math.max(-1, Math.min(1, e.translationX / THRESHOLD));
          if (progress) progress.value = p;
          // لرزشِ آستانه دقیقاً در لحظه‌ی عبور، و فقط یک‌بار — تا وقتی انگشت
          // همان‌جا می‌لرزد، دستگاه ول‌کن نشود.
          const side = p >= 1 ? 1 : p <= -1 ? -1 : 0;
          if (side !== crossed.value) {
            crossed.value = side;
            if (side !== 0) runOnJS(hapticThreshold)();
          }
        })
        .onEnd((e) => {
          held.value = withSpring(0, springs.gentle);
          crossed.value = 0;
          const far = Math.abs(x.value) > THRESHOLD;
          const fast = Math.abs(e.velocityX) > FLING_VELOCITY;
          const byPosition = Math.sign(x.value);
          const byVelocity = Math.sign(e.velocityX);
          // کارت وقتی می‌رود که یا از آستانه رد شده باشد یا تکانِ کافی خورده
          // باشد — ولی در هر دو حالت، تکان نباید خلافِ جابه‌جایی باشد. وگرنه
          // کسی که کارت را برده و پشیمان شده و به عقب می‌کشدش، همان چیزی را
          // می‌گیرد که نمی‌خواست.
          const decided = (far || fast) && (!fast || byVelocity === byPosition) ? byPosition : 0;
          if (decided !== 0) {
            y.value = withTiming(y.value + e.velocityY * 0.08, { duration: FLIGHT });
            finish(decided > 0 ? 'like' : 'pass');
            return;
          }
          x.value = withSpring(0, springs.gentle);
          y.value = withSpring(0, springs.gentle);
          if (progress) progress.value = withSpring(0, springs.gentle);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * تک‌ضربه سه معنی دارد و ناحیه‌ی لمس تعیینش می‌کند:
   *   پایینِ کارت (نوارِ اطلاعات) → بازکردنِ پروفایلِ کامل
   *   نیمه‌ی چپ                  → عکسِ بعدی
   *   نیمه‌ی راست                → عکسِ قبلی
   *
   * چرا چپ «بعدی» است: کلِ اپ راست‌به‌چپ است و «جلو» سمتِ چپ است — همان
   * قراردادی که دکمه‌ی بازگشت هم از آن پیروی می‌کند (شورونِ رو به راست یعنی
   * عقب). اگر فقط یک عکس باشد، هر ضربه‌ای پروفایل را باز می‌کند تا رفتارِ
   * قبلیِ کارت دست‌نخورده بماند.
   */
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .onEnd((e, ok) => {
          if (!ok) return;
          if (cardH.value > 0 && e.y > cardH.value * 0.72) {
            if (onOpenProfile) runOnJS(onOpenProfile)();
            return;
          }
          if (photoCount < 2) {
            if (onOpenProfile) runOnJS(onOpenProfile)();
            return;
          }
          runOnJS(step)(e.x < cardW.value / 2 ? 1 : -1);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpenProfile, photoCount]
  );

  const gesture = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      {
        rotate: `${interpolate(
          x.value,
          [-width, 0, width],
          [-MAX_ROTATION * pivot.value, 0, MAX_ROTATION * pivot.value],
          Extrapolation.CLAMP
        )}deg`,
      },
      // بلندشدنِ محسوسِ کارت از دسته وقتی در دست است.
      { scale: 1 + held.value * 0.02 },
    ],
  }));

  // نورِ لبه در جهتِ تصمیم — پیش از آنکه تمبر خوانا شود، لبه‌ی کارت رنگ می‌گیرد.
  const likeGlow = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passGlow = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // تمبرها هم‌زمان محو و بزرگ می‌شوند — فقط شفافیت، حسِ «لایه‌ی روی عکس» دارد.
  const likeStamp = useAnimatedStyle(() => {
    const t = interpolate(x.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ scale: 0.7 + t * 0.3 }, { rotate: '-12deg' }] };
  });
  const passStamp = useAnimatedStyle(() => {
    const t = interpolate(x.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ scale: 0.7 + t * 0.3 }, { rotate: '12deg' }] };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.5 + held.value * 0.12,
    shadowRadius: 22 + held.value * 12,
  }));

  const photo = photos[photoIndex];
  const km = candidate.distanceM != null ? Math.max(1, Math.round(candidate.distanceM / 1000)) : null;
  const shared = new Set(sharedInterests ?? []);
  const chips = (candidate.interests ?? []).slice(0, 3);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={(e) => {
          cardH.value = e.nativeEvent.layout.height;
          cardW.value = e.nativeEvent.layout.width;
        }}
        style={[styles.card, shadow.card, shadowStyle, cardStyle]}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>{(candidate.name || '؟').charAt(0)}</Text>
          </View>
        )}
        <Scrim height="58%" />

        {/* نوارِ قطعه‌ایِ عکس‌ها. زیرش یک اسکریمِ کوتاه است چون خودِ نوار روی
            عکسِ روشن گم می‌شود، و بدونِ آن کاربر نمی‌فهمد عکسِ دیگری هم هست. */}
        {photoCount > 1 ? (
          <>
            <LinearGradient
              colors={gradients.topScrim}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topScrim}
              pointerEvents="none"
            />
            <View style={styles.segments} pointerEvents="none">
              {photos.map((p, i) => (
                <View key={p} style={[styles.segment, i === photoIndex && styles.segmentOn]} />
              ))}
            </View>
          </>
        ) : null}

        {/* لبه‌های نوری — طلا سمتِ پسند، رز سمتِ رد. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowLayer, likeGlow]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(218,184,119,0.34)', 'rgba(218,184,119,0)']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0.35, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowLayer, passGlow]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,92,122,0.32)', 'rgba(255,92,122,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.65, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* تمبرِ پسند (راست) و رد (چپ) — هم‌جهت با حرکتِ فیزیکیِ انگشت */}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStamp]} pointerEvents="none">
          <Text style={[styles.stampText, { color: colors.gold2 }]}>پسند</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.passStamp, passStamp]} pointerEvents="none">
          <Text style={[styles.stampText, { color: colors.rose }]}>رد</Text>
        </Animated.View>

        <View style={styles.info} pointerEvents="none">
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {candidate.name}
              {candidate.age ? `، ${faNum(candidate.age)}` : ''}
            </Text>
            {candidate.tier ? <TierBadge tier={candidate.tier} /> : null}
            {candidate.isOnline ? (
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>آنلاین</Text>
              </View>
            ) : null}
          </View>
          {km != null ? (
            <View style={styles.metaRow}>
              <Icon name="map" size={13} tint="white" style={styles.metaIcon} />
              <Text style={styles.meta}>{faNum(km)} کیلومتر دورتر</Text>
            </View>
          ) : null}
          {candidate.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {candidate.bio}
            </Text>
          ) : null}
          {/* علاقه‌مندی‌ها تا امروز فقط در پروفایلِ کامل دیده می‌شدند، درحالی‌که
              همین‌جا هم می‌آمدند. مشترک‌ها طلایی‌اند — تنها چیزی روی کارت که
              درباره‌ی «تو و او» حرف می‌زند، نه فقط درباره‌ی او. */}
          {chips.length > 0 ? (
            <View style={styles.chips}>
              {chips.map((label) => {
                const isShared = shared.has(label);
                return (
                  <View key={label} style={[styles.chip, isShared && styles.chipShared]}>
                    <Text style={[styles.chipText, isShared && styles.chipTextShared]} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  glowLayer: { borderRadius: radius.xl },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 96 },
  segments: {
    position: 'absolute',
    top: 12,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row-reverse',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  segmentOn: { backgroundColor: colors.gold2 },
  noPhoto: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: fonts.bold, fontSize: 72, color: colors.goldSoft },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.backdrop,
  },
  likeStamp: { right: 22, borderColor: colors.gold2 },
  passStamp: { left: 22, borderColor: colors.rose },
  stampText: { fontFamily: fonts.bold, fontSize: fontSizes.xl },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.xl - 4 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm + 2 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    // یک پله بزرگ‌تر از قبل: نامِ آدم بزرگ‌ترین چیزِ روی کارت است، چون
    // تصمیمی که کاربر می‌گیرد درباره‌ی اوست.
    fontSize: 30,
    lineHeight: 44,
    color: colors.onPhoto,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  onlinePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#5BD08F' },
  onlineText: { fontFamily: fonts.medium, fontSize: 11, color: '#5BD08F' },
  metaIcon: { opacity: 0.85 },
  meta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.onPhotoDim,
    textAlign: 'right',
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm + 1,
    color: colors.onPhotoDim,
    marginTop: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm - 2, marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipShared: { backgroundColor: colors.goldFaint, borderColor: colors.goldSoft },
  chipText: { fontFamily: fonts.medium, fontSize: fontSizes.xs + 1, color: colors.onPhotoDim },
  chipTextShared: { color: colors.gold2 },
});
