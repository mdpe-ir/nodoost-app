import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, spacing } from '@/core/theme';

/** پدینگِ بالای `ScreenContainer` که باید خنثی شود. */
const TOP_PAD = spacing.sm;

/**
 * نسبتِ ابعادِ خودِ طرح (`viewBox="0 0 1125 2436"`) — یعنی یک صفحه‌ی گوشی،
 * نه یک کاشیِ کوچک. برای همین «پوشاندن» درست است و «تکرار» نه: طرح لبه‌هایش
 * به هم نمی‌خورد و کاشی‌کردنش درزِ آشکار می‌سازد.
 */
const ART_RATIO = 1125 / 2436;

/**
 * حداقل نسبتِ ارتفاعِ صفحه که طرح باید بپوشاند. روی صفحه‌های خیلی پهن
 * (تبلت، افقی) اگر فقط عرض را ملاک بگیریم، طرح آن‌قدر بزرگ می‌شود که دیگر
 * «بافت» دیده نمی‌شود و چند خطِ درشت می‌ماند.
 */
const MAX_SCALE = 1.6;

/**
 * پس‌زمینه‌ی گفتگو — طرحِ خطیِ طلایی پشتِ حباب‌ها.
 *
 * **مقیاس، مسئله‌ی اصلی این کامپوننت است.** طرح یک SVG است، پس با هر اندازه‌ای
 * تیز می‌ماند؛ کارِ سختش این است که روی هر صفحه‌ای *به همان بزرگیِ ادراکی*
 * دیده شود. اگر فقط `contentFit="cover"` بدهیم، روی گوشیِ باریک طرح کشیده و
 * روی تبلت غول‌آسا می‌شود.
 *
 * پس اندازه‌ی خودِ تصویر را حساب می‌کنیم: بلندایش همیشه به قدِ صفحه است و
 * پهنایش از نسبتِ خودِ طرح می‌آید. اگر این پهنا کمتر از عرضِ صفحه شد (صفحه‌ی
 * پهن)، تا عرضِ صفحه بزرگش می‌کنیم ولی نه بیشتر از `MAX_SCALE` — از آن به بعد
 * طرح در وسط می‌ماند و کناره‌ها را رنگِ پس‌زمینه پر می‌کند، که از یک بافتِ
 * بیش‌ازحد بزرگ‌شده بهتر است.
 *
 * شدت با `opacity` تنظیم می‌شود نه با رنگِ دارایی، تا یک فایل برای همه‌ی
 * حالت‌ها بس باشد.
 */
export function ChatBackground() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const naturalWidth = height * ART_RATIO;
  const scale = Math.min(Math.max(1, width / naturalWidth), MAX_SCALE);
  const artWidth = naturalWidth * scale;
  const artHeight = height * scale;

  return (
    <View
      /*
       * تا زیرِ نوارِ وضعیت کشیده می‌شود. در Yoga فرزندِ `absolute` نسبت به
       * *داخلِ* پدینگِ والد جا می‌گیرد، و `ScreenContainer` به اندازه‌ی
       * ناحیه‌ی امن پدینگِ بالا دارد؛ بدونِ این افست، نوارِ باریکی از بالای
       * صفحه بی‌طرح می‌ماند.
       */
      style={[styles.wrap, { top: -insets.top - TOP_PAD }]}
      pointerEvents="none"
    >
      <Image
        source={require('../../../assets/images/chat-pattern.svg')}
        style={[styles.art, { width: artWidth, height: artHeight }]}
        contentFit="contain"
        // پس‌زمینه یک‌بار کشیده می‌شود و عوض نمی‌شود؛ محوشدنِ ورودی لازم ندارد.
        transition={0}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // پس‌زمینه خودش مات است؛ فقط طرح کم‌رنگ می‌شود. اگر `opacity` روی این قاب
    // می‌نشست، رنگِ پس‌زمینه هم نیمه‌شفاف می‌شد و صفحه‌ی زیرین بیرون می‌زد.
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // طرح باید بافت باشد نه تصویر: آن‌قدر کم‌رنگ که متنِ حباب‌ها بی‌رقیب بماند.
  art: { opacity: 0.07 },
});
