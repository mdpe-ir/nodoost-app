import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MAX_UPLOAD_SIZE, toJpeg } from '@/core/media/normalizeImage';
import { measureImage, type CropRect } from '@/core/media/imageOps';
import { photoErrorMessage } from '@/core/media/photoErrors';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/core/theme';

const HEADER_H = 56;
const FOOTER_H = 92;
const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** کششِ لاستیکی هنگامِ عبور از مرز — رهاکردن با فنر برمی‌گرداند. */
const RUBBER = 0.35;
const SNAP = { damping: 22, stiffness: 220, mass: 0.8 } as const;

interface Props {
  visible: boolean;
  uri: string | null;
  /** ابعادِ منبع اگر از قبل معلوم است؛ وگرنه خودمان اندازه می‌گیریم. */
  sourceWidth?: number;
  sourceHeight?: number;
  onCancel: () => void;
  onConfirm: (uri: string) => void;
  onError: (message: string) => void;
}

/**
 * ویرایشگرِ تمام‌صفحه‌ی عکس — قابِ مربعِ ثابت، عکس زیرِ آن حرکت و بزرگ‌نمایی می‌کند.
 *
 * چرا قابْ ثابت و عکسْ متحرک است: مختصاتِ برش بدونِ هیچ تبدیلِ اضافه‌ای از حالتِ
 * جابه‌جایی و مقیاس درمی‌آید. مرکزِ عکس در tx=ty=0 دقیقاً روی مرکزِ قاب می‌نشیند و
 * در scale=۱ کوچک‌ترین ضلعِ عکس برابرِ ضلعِ قاب است؛ یعنی قاب هیچ‌وقت خالی نمی‌ماند.
 *
 * توجه: فراخوان باید key={uri} بدهد. قاب‌بندی (جابه‌جایی/مقیاس) در مقدارهای مشترکِ
 * ریانیمیتد نگه‌داری می‌شود و با هر عکسِ تازه باید از صفر شروع شود؛ سوارشدنِ دوباره‌ی
 * کامپوننت این کار را بدونِ افکتِ ریست انجام می‌دهد.
 */
export function PhotoCropper({
  visible,
  uri,
  sourceWidth,
  sourceHeight,
  onCancel,
  onConfirm,
  onError,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  // ابعادِ منبع معمولاً از پیش معلوم است (خروجیِ همان تبدیلی که عکس را JPEG کرد)؛
  // اگر نبود، از خودِ فایل می‌خوانیمش و تا آن لحظه ویرایش غیرفعال است.
  const [dims, setDims] = useState<{ w: number; h: number } | null>(
    sourceWidth && sourceHeight ? { w: sourceWidth, h: sourceHeight } : null
  );
  const [working, setWorking] = useState(false);

  const stageH = Math.max(220, winH - insets.top - insets.bottom - HEADER_H - FOOTER_H);
  const stageW = winW;
  const frame = Math.max(160, Math.min(stageW - spacing.xl, stageH - spacing.xl));

  useEffect(() => {
    if (dims || !uri) return;
    let alive = true;
    measureImage(uri)
      .then((d) => {
        if (alive && d.width > 0 && d.height > 0) setDims({ w: d.width, h: d.height });
      })
      .catch(() => {
        // بدونِ ابعاد، برش ممکن نیست؛ اما کاربر را بن‌بست نمی‌کنیم —
        // «تأیید» به مسیرِ فشرده‌سازیِ بدونِ برش می‌افتد.
      });
    return () => {
      alive = false;
    };
  }, [uri, dims]);

  const ratio = dims ? dims.w / dims.h : 1;
  const baseW = ratio >= 1 ? frame * ratio : frame;
  const baseH = ratio >= 1 ? frame : frame / ratio;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  /** ۱ یعنی انگشت روی صفحه است — شبکه‌ی راهنما فقط همان موقع دیده می‌شود. */
  const active = useSharedValue(0);

  const canEdit = dims != null;

  /*
   * هر دو ژست «افزایشی» نوشته شده‌اند (بر پایه‌ی تغییرِ همین فریم، نه مقدارِ آغازین).
   * دلیلش هم‌زمانیِ کشیدن و بزرگ‌نمایی است: با دو انگشت هر دو ژست فعال‌اند و اگر
   * هرکدام از یک عکسِ لحظه‌ی شروع حساب می‌کرد، دیگری را عقب می‌راند و تصویر می‌پرید.
   */
  const pan = Gesture.Pan()
    .enabled(canEdit && !working)
    .onStart(() => {
      active.value = withTiming(1, { duration: 120 });
    })
    .onChange((e) => {
      const maxX = Math.max(0, (baseW * scale.value - frame) / 2);
      const maxY = Math.max(0, (baseH * scale.value - frame) / 2);
      // بیرونِ مرز، انگشت «سنگین» می‌شود؛ حسِ فیزیکیِ آشنای iOS/اینستاگرام.
      tx.value += e.changeX * (Math.abs(tx.value) > maxX ? RUBBER : 1);
      ty.value += e.changeY * (Math.abs(ty.value) > maxY ? RUBBER : 1);
    })
    .onEnd(() => {
      const maxX = Math.max(0, (baseW * scale.value - frame) / 2);
      const maxY = Math.max(0, (baseH * scale.value - frame) / 2);
      tx.value = withSpring(Math.min(maxX, Math.max(-maxX, tx.value)), SNAP);
      ty.value = withSpring(Math.min(maxY, Math.max(-maxY, ty.value)), SNAP);
    })
    .onFinalize(() => {
      active.value = withTiming(0, { duration: 220 });
    });

  const pinch = Gesture.Pinch()
    .enabled(canEdit && !working)
    .onStart(() => {
      active.value = withTiming(1, { duration: 120 });
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      // زیرِ مقیاسِ ۱ کمی کش می‌آید تا رهاکردن، بازگشتِ فنری داشته باشد.
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE * 0.85, startScale.value * e.scale));
      const k = next / scale.value;
      // نقطه‌ی کانونیِ همین لحظه نسبت به مرکزِ قاب — محتوای زیرِ انگشت‌ها ثابت می‌ماند.
      const fx = e.focalX - stageW / 2;
      const fy = e.focalY - stageH / 2;
      tx.value = fx - (fx - tx.value) * k;
      ty.value = fy - (fy - ty.value) * k;
      scale.value = next;
    })
    .onEnd(() => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value));
      const maxX = Math.max(0, (baseW * s - frame) / 2);
      const maxY = Math.max(0, (baseH * s - frame) / 2);
      scale.value = withSpring(s, SNAP);
      tx.value = withSpring(Math.min(maxX, Math.max(-maxX, tx.value)), SNAP);
      ty.value = withSpring(Math.min(maxY, Math.max(-maxY, ty.value)), SNAP);
    })
    .onFinalize(() => {
      active.value = withTiming(0, { duration: 220 });
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));
  const gridStyle = useAnimatedStyle(() => ({ opacity: active.value }));

  /**
   * مستطیلِ برش را در مختصاتِ پیکسلیِ عکسِ اصلی حساب می‌کند.
   *
   * عکس با اندازه‌ی نمایشیِ baseW×baseH رسم می‌شود و سپس با scale بزرگ می‌شود؛
   * پس اندازه‌ی دیده‌شده disp = base×scale است. مرکزِ عکس روی (tx,ty) نسبت به
   * مرکزِ قاب است، بنابراین لبه‌ی چپِ عکس تا لبه‌ی چپِ قاب برابرِ
   * (disp − frame)/2 − t نقطه فاصله دارد. ضربِ آن در نسبتِ «پیکسلِ اصلی به نقطه»
   * (src/disp) همان originِ برش است و ضلعِ قاب هم به همان نسبت به پیکسل تبدیل می‌شود.
   *
   * مقدارها پیش از محاسبه به بازه‌ی مجاز بریده می‌شوند؛ ممکن است کاربر درست وسطِ
   * فنرِ بازگشت «تأیید» را بزند و مقدارِ لحظه‌ای بیرون از مرز باشد.
   */
  function cropRect(): CropRect {
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value));
    const dispW = baseW * s;
    const dispH = baseH * s;
    const maxX = Math.max(0, (dispW - frame) / 2);
    const maxY = Math.max(0, (dispH - frame) / 2);
    const cx = Math.min(maxX, Math.max(-maxX, tx.value));
    const cy = Math.min(maxY, Math.max(-maxY, ty.value));
    const pxX = (dims?.w ?? 0) / dispW;
    const pxY = (dims?.h ?? 0) / dispH;
    return {
      originX: (maxX - cx) * pxX,
      originY: (maxY - cy) * pxY,
      width: frame * pxX,
      height: frame * pxY,
    };
  }

  async function confirm() {
    if (!uri || working) return;
    setWorking(true);
    try {
      let out;
      try {
        out = await toJpeg(uri, {
          crop: canEdit ? cropRect() : undefined,
          maxSize: MAX_UPLOAD_SIZE,
        });
      } catch {
        // ریاضیِ برش یا خودِ برش شکست خورد — دستِ‌کم عکسِ کامل را JPEGِ فشرده بده
        // تا کاربر پشتِ یک خطای فنی گیر نکند.
        out = await toJpeg(uri, { maxSize: MAX_UPLOAD_SIZE });
      }
      onConfirm(out.uri);
    } catch (e) {
      onError(photoErrorMessage(e));
    } finally {
      setWorking(false);
    }
  }

  const gutter = (stageH - frame) / 2;
  const side = (stageW - frame) / 2;

  return (
    <Modal
      visible={visible && uri != null}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.header, { height: HEADER_H, marginTop: insets.top }]}>
          <Pressable
            onPress={onCancel}
            disabled={working}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="انصراف از ویرایشِ عکس"
          >
            <Text style={styles.headerCancel}>انصراف</Text>
          </Pressable>

          <Text style={styles.headerTitle}>قابِ عکس</Text>

          <Pressable
            onPress={confirm}
            disabled={working}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="تأییدِ عکس"
            accessibilityState={{ disabled: working, busy: working }}
          >
            <Text style={[styles.headerConfirm, working && styles.dim]}>تأیید</Text>
          </Pressable>
        </View>

        <GestureDetector gesture={gesture}>
          <View style={[styles.stage, { width: stageW, height: stageH }]}>
            {uri ? (
              <Animated.View
                style={[
                  styles.imageWrap,
                  {
                    width: baseW,
                    height: baseH,
                    left: (stageW - baseW) / 2,
                    top: (stageH - baseH) / 2,
                  },
                  imageStyle,
                ]}
              >
                <Image
                  source={{ uri }}
                  style={{ width: baseW, height: baseH }}
                  contentFit={canEdit ? 'cover' : 'contain'}
                  transition={140}
                />
              </Animated.View>
            ) : null}

            {/* تیرگیِ بیرونِ قاب — چهار نوار به‌جای یک ماسک، تا روی همه‌ی پلتفرم‌ها بخواند. */}
            <View style={[styles.dimBar, { left: 0, right: 0, top: 0, height: gutter }]} pointerEvents="none" />
            <View style={[styles.dimBar, { left: 0, right: 0, bottom: 0, height: gutter }]} pointerEvents="none" />
            <View style={[styles.dimBar, { left: 0, top: gutter, width: side, height: frame }]} pointerEvents="none" />
            <View style={[styles.dimBar, { right: 0, top: gutter, width: side, height: frame }]} pointerEvents="none" />

            <View
              style={[styles.frame, { left: side, top: gutter, width: frame, height: frame }]}
              pointerEvents="none"
            >
              {/* شبکه‌ی یک‌سومِ طلایی — فقط هنگامِ کار با عکس ظاهر می‌شود. */}
              <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents="none">
                <View style={[styles.gridLine, styles.gridV, { left: frame / 3 }]} />
                <View style={[styles.gridLine, styles.gridV, { left: (frame * 2) / 3 }]} />
                <View style={[styles.gridLine, styles.gridH, { top: frame / 3 }]} />
                <View style={[styles.gridLine, styles.gridH, { top: (frame * 2) / 3 }]} />
              </Animated.View>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {!canEdit && uri ? (
              <View style={styles.stageLoader} pointerEvents="none">
                <ActivityIndicator color={colors.gold} />
              </View>
            ) : null}
          </View>
        </GestureDetector>

        <View style={[styles.footer, { height: FOOTER_H, paddingBottom: insets.bottom }]}>
          <Text style={styles.hint}>
            {canEdit
              ? 'با کشیدن جابه‌جا کن و با دو انگشت بزرگ‌نمایی بده؛ چهره‌ات را وسطِ قاب بگذار.'
              : 'در حالِ آماده‌سازیِ عکس…'}
          </Text>
        </View>

        {working ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.busyText}>در حالِ آماده‌سازیِ عکس…</Text>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07050B' },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  headerBtn: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  dim: { opacity: 0.5 },
  headerCancel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerConfirm: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.gold,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  headerTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    writingDirection: 'rtl',
  },

  stage: { overflow: 'hidden', backgroundColor: '#07050B' },
  imageWrap: { position: 'absolute' },
  dimBar: { position: 'absolute', backgroundColor: 'rgba(7,5,11,0.78)' },
  frame: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.28)' },
  gridV: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  gridH: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: colors.gold2 },
  cornerTL: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  stageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(7,5,11,0.72)',
  },
  busyText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
});
