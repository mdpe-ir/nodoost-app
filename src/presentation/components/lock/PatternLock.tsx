import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { haptics } from '@/core/haptics';
import { colors } from '@/core/theme';

/**
 * قفلِ الگویی ۳×۳ — الهامگرفته از تلگرام.
 *
 * چرا PanResponder و نه gesture-handler: الگو ورودیِ مماس است، نه ژستِ
 * ترکیبی؛ PanResponder بدونِ worklet و runOnJS همان روی ترد JS کار میکند و
 * پیچیدگیِ reanimated برای خطوطِ میانی لازم نمیشود.
 *
 * خطوط با Viewِ چرخیده کشیده میشوند (react-native-svg در پروژه نیست و
 * وابستگیِ تازه اضافه نمیکنیم): هر پارهخطی مرکزش وسطِ فاصلهی دو نقطه است
 * و دورِ مرکزِ خودش میچرخد.
 */

const MIN_DOTS = 4;
const DOT = 16;
const HIT_RADIUS = 34;
const LINE_WIDTH = 5;

interface DotCenter {
  x: number;
  y: number;
}

interface Segment {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function PatternLock({
  onEnd,
  disabled = false,
  /** با عوض شدن این عدد الگوی رندرشده پاک میشود (پس از خطا یا تأیید). */
  resetKey = 0,
}: {
  onEnd: (dots: number[]) => void;
  disabled?: boolean;
  resetKey?: number;
}) {
  const [size, setSize] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [head, setHead] = useState<DotCenter | null>(null);
  const activeRef = useRef(false);
  /** نسخهی فعلیِ order در هندلرها — تا setStateها به هم نریزند. */
  const orderRef = useRef<number[]>([]);
  const firedRef = useRef(false);

  const centers = useMemo<DotCenter[]>(() => {
    if (size <= 0) return [];
    const pad = size / 6;
    const step = (size - 2 * pad) / 2;
    return Array.from({ length: 9 }, (_, i) => ({
      x: pad + (i % 3) * step,
      y: pad + Math.floor(i / 3) * step,
    }));
  }, [size]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSize(e.nativeEvent.layout.width);
  }, []);

  const reset = useCallback(() => {
    orderRef.current = [];
    setOrder([]);
    setHead(null);
  }, []);

  // پاکسازیِ الگو هنگامِ عوض شدنِ resetKey (پس از خطا یا تأیید) ذاتاً یعنی
  // setState در افکت — هدفِ همین افکت همین است و راهِ همگام ندارد.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [resetKey, reset]);

  const pickDot = useCallback(
    (loc: { x: number; y: number }): number | null => {
      for (let i = 0; i < centers.length; i++) {
        const c = centers[i];
        if (Math.hypot(loc.x - c.x, loc.y - c.y) <= HIT_RADIUS) return i;
      }
      return null;
    },
    [centers]
  );

  const handleMove = useCallback(
    (loc: { x: number; y: number }) => {
      if (!activeRef.current) return;
      const dot = pickDot(loc);
      if (dot !== null && !orderRef.current.includes(dot)) {
        orderRef.current = [...orderRef.current, dot];
        setOrder(orderRef.current);
        haptics.select();
      }
      setHead(loc);
    },
    [pickDot]
  );

  const handleEnd = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    const dots = orderRef.current;
    if (firedRef.current) return;
    firedRef.current = true;
    if (dots.length >= MIN_DOTS) {
      haptics.commit();
      onEnd(dots);
    } else {
      // الگوی ناقص یعنی «لغو» — صفحهی میزبان تصمیم میگیرد چه برساند.
      haptics.warn();
      onEnd([]);
      reset();
    }
  }, [onEnd, reset]);

  const panResponder = useMemo(
    () =>
      // PanResponder باید همگام ساخته شود چون panHandlers در همان رندر به View
      // وصل میشود. هندلرهایش فقط در رویدادِ لمس اجرا میشوند، نه در رندر —
      // پس خواندنِ ref داخلشان خطرِ رندرِ کهنه ندارد.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => {
          if (disabled) return;
          activeRef.current = true;
          firedRef.current = false;
          reset();
          handleMove({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
        },
        onPanResponderMove: (evt) =>
          handleMove({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }),
        onPanResponderRelease: handleEnd,
        onPanResponderTerminate: handleEnd,
      }),
    [disabled, handleEnd, handleMove, reset]
  );

  const segments: Segment[] = useMemo(() => {
    const list: Segment[] = [];
    for (let i = 1; i < order.length; i++) {
      const a = centers[order[i - 1]];
      const b = centers[order[i]];
      if (a && b)
        list.push({ key: `${order[i - 1]}-${order[i]}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return list;
  }, [order, centers]);

  const tail = order.length > 0 ? centers[order[order.length - 1]] : null;

  return (
    <View
      style={[styles.canvas, disabled && styles.canvasDisabled]}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      accessibilityLabel="قفل الگویی"
    >
      {size > 0 && (
        <>
          {segments.map((s) => (
            <View key={s.key} style={lineStyle(s.x1, s.y1, s.x2, s.y2)} />
          ))}
          {/* پارهخط زنده تا انگشت — حسِ «کشیدن» میدهد. */}
          {head && tail ? <View style={lineStyle(tail.x, tail.y, head.x, head.y, true)} /> : null}
          {centers.map((c, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                order.includes(i) ? styles.dotActive : null,
                { left: c.x - DOT / 2, top: c.y - DOT / 2 },
              ]}
            />
          ))}
        </>
      )}
    </View>
  );
}

/** استایلِ یک پارهخط — مرکز در وسطِ فاصله، چرخش دورِ مرکزِ خودش. */
const lineStyle = (x1: number, y1: number, x2: number, y2: number, live = false) => {
  const len = Math.max(Math.hypot(x2 - x1, y2 - y1), 1);
  const angle = `${Math.atan2(y2 - y1, x2 - x1)}rad`;
  return {
    position: 'absolute' as const,
    width: len,
    height: LINE_WIDTH,
    left: (x1 + x2) / 2 - len / 2,
    top: (y1 + y2) / 2 - LINE_WIDTH / 2,
    borderRadius: LINE_WIDTH / 2,
    backgroundColor: live ? colors.goldSoft : colors.gold,
    transform: [{ rotate: angle }],
    opacity: live ? 0.6 : 1,
  };
};

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    alignSelf: 'center',
  },
  canvasDisabled: { opacity: 0.5 },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  dotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold2,
  },
});
