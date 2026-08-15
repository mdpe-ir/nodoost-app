import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { durations, staggerDelay } from '@/core/theme/motion';

/**
 * ورودِ آبشاریِ آیتم‌های فهرست.
 *
 * چرا لازم است: فهرستی که یک‌جا ظاهر می‌شود، «رندر شد» به نظر می‌رسد؛ فهرستی
 * که ردیف‌هایش پشتِ سرِ هم می‌آیند، «دارد پر می‌شود» به نظر می‌رسد. تفاوتش در
 * زمانِ کل ناچیز است (‎<۳۰۰ms‎) ولی حسِ سرعتِ ادراکی را بالا می‌برد، چون چشم
 * چیزی برای دنبال‌کردن دارد.
 *
 * تأخیر بعد از چند ردیفِ اول سقف می‌خورد (`staggerDelay`) — وگرنه در فهرستِ
 * بلند، ردیفِ بیستم یک ثانیه دیر می‌آید و کل کار کند حس می‌شود. آیتم‌هایی هم
 * که با اسکرول بازیافت می‌شوند تأخیرِ ردیفِ خودشان را می‌گیرند، نه صفر.
 */
export function Stagger({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(durations.quick).delay(staggerDelay(index))}>
      {children}
    </Animated.View>
  );
}
