import React, { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { faNum, faPrice } from '@/core/utils/faNum';
import { durations } from '@/core/theme/motion';

interface Props {
  value: number;
  /** `price` جداکننده‌ی هزارگان می‌گذارد؛ `plain` فقط رقمِ فارسی. */
  format?: 'plain' | 'price';
  style?: StyleProp<TextStyle>;
  /** مدتِ شمارش. پیش‌فرض کوتاه است — شمارشِ طولانی خواندن را عقب می‌اندازد. */
  duration?: number;
}

/**
 * عددی که تا مقدارِ تازه بالا می‌رود، به‌جای اینکه بپرد.
 *
 * فقط جایی به کار می‌رود که خودِ **تغییر** خبر است: امتیازی که گرفتی، رتبه‌ای
 * که بالا رفت، قیمتی که با انتخابِ سطحِ دیگر عوض شد. روی عددی که فقط نمایشِ
 * وضعیت است (تعدادِ پیام‌های نخوانده) شمارش، تزیینِ بی‌مورد است و خواندن را
 * کند می‌کند.
 *
 * شمارش عمداً روی تردِ JS است نه worklet: خروجی **متن** است و متن هرچند فریم
 * یک‌بار عوض می‌شود، نه هر فریم؛ بردنش به تردِ UI سود ندارد و کدِ فرمت‌کردنِ
 * رقمِ فارسی را هم باید worklet می‌کرد.
 */
export function AnimatedNumber({ value, format = 'plain', style, duration = durations.slow }: Props) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const start = from.current;
    const delta = value - start;
    if (delta === 0) return;

    // اولین رندر نباید از صفر بشمارد؛ فقط تغییرهای بعدی شمرده می‌شوند.
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / duration);
      // منحنیِ کندشونده: عدد اول تند می‌رود و آخر می‌نشیند.
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + delta * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      from.current = value;
    };
  }, [value, duration]);

  return <Text style={style}>{format === 'price' ? faPrice(shown) : faNum(shown)}</Text>;
}
