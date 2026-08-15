/** نام‌های فونت مطابقِ پکیجِ @expo-google-fonts/vazirmatn. */
export const fonts = {
  regular: 'Vazirmatn_400Regular',
  medium: 'Vazirmatn_500Medium',
  bold: 'Vazirmatn_700Bold',
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  /**
   * دو پله‌ی نمایشی. مقیاسِ قبلی روی ۲۸ تمام می‌شد، و همین باعث می‌شد لحظه‌های
   * بزرگِ اپ (نامِ روی کارت، «مچ شدید») هم‌وزنِ عنوانِ یک صفحه‌ی تنظیمات
   * دیده شوند. این دو پله فقط برای همان لحظه‌هاست — اگر جای سومی لازم شد،
   * احتمالاً آن‌جا لحظه‌ی بزرگی نیست.
   */
  display: 34,
  hero: 44,
} as const;

/** ارتفاعِ خطِ متناظر با هر اندازه — وزیرمتن قدبلند است و به فضای عمودی نیاز دارد. */
export const lineHeights: Record<keyof typeof fontSizes, number> = {
  xs: 18,
  sm: 22,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
  display: 48,
  hero: 60,
};
