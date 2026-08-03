const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقامِ لاتین را به فارسی تبدیل می‌کند. */
export const faNum = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);

/**
 * ارقامِ فارسی/عربی را به لاتین برمی‌گرداند — عکسِ faNum.
 *
 * لازم است چون کیبوردِ فارسی «۰۹۱۲…» می‌دهد ولی سرور و فیلترهای عددیِ ما فقط
 * رقمِ لاتین می‌فهمند؛ بدونِ این، پاک‌سازی‌هایی مثل replace(/[^0-9]/g, '')
 * ورودیِ کاربر را کاملاً خالی می‌کنند.
 */
export const enNum = (input: string): string =>
  input.replace(/[۰-۹٠-٩]/g, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x0660 && code <= 0x0669 ? code - 0x0660 : code - 0x06f0);
  });

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
