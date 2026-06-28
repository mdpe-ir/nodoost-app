const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقامِ لاتین را به فارسی تبدیل می‌کند. */
export const faNum = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);

/** قیمت با جداکننده‌ی هزارگانِ فارسی. */
export const faPrice = (n: number): string =>
  faNum(n.toLocaleString('en-US')).replace(/,/g, '٬');
