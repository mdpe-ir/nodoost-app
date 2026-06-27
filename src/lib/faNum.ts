const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقامِ لاتین را فارسی می‌کند */
export function faNum(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);
}

/** قیمت با جداکننده‌ی هزارگانِ فارسی */
export function faPrice(n: number): string {
  return faNum(n.toLocaleString('en-US')).replace(/,/g, '٬');
}
