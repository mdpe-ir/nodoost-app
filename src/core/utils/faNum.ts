const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقامِ لاتین را به فارسی تبدیل می‌کند. */
export const faNum = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);

/** قیمت با جداکننده‌ی هزارگانِ فارسی. */
export const faPrice = (n: number): string =>
  faNum(n.toLocaleString('en-US')).replace(/,/g, '٬');

/** فاصله‌ی خوانا با ارقامِ فارسی: «۳۰۰ متر» / «۱٫۲ کیلومتر». */
export const faDistance = (m?: number): string | null => {
  if (m == null) return null;
  if (m < 1000) return `${faNum(Math.max(1, Math.round(m)))} متر`;
  const km = m / 1000;
  const rounded = km >= 10 ? String(Math.round(km)) : String(Math.round(km * 10) / 10);
  return `${faNum(rounded).replace('.', '٫')} کیلومتر`;
};
