import { faNum } from './faNum';

/** زمانِ نسبیِ فارسی (مثلِ «۵ دقیقه پیش») — با ارقامِ فارسی. */
export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'لحظاتی پیش';
  const m = Math.floor(s / 60);
  if (m < 60) return `${faNum(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${faNum(h)} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${faNum(d)} روز پیش`;
  return `${faNum(Math.floor(d / 7))} هفته پیش`;
}

/** ساعتِ HH:MM با ارقامِ فارسی؛ برای زمانِ پیام‌ها. */
export function faClock(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return faNum(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
}

/** برچسبِ روزِ پیام‌ها: «امروز»، «دیروز» یا تاریخِ شمسی. */
export function faDayLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'دیروز';
  return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
}

/** کلیدِ روز برای گروه‌بندیِ پیام‌ها. */
export function dayKey(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// — تبدیلِ تقویمِ میلادی به شمسی (جلالی) —
// الگوریتمِ کلاسیکِ jdf (بورکوفسکی)؛ خودبسنده تا به Intlِ ناقصِ Hermes وابسته نباشیم.
const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** میلادی → شمسی: {jy, jm, jd} (jm از ۱). */
function toJalaali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    ~~((gy2 + 3) / 4) -
    ~~((gy2 + 99) / 100) +
    ~~((gy2 + 399) / 400) -
    80 +
    gd +
    gDaysInMonth[gm - 1];
  jy += 33 * ~~(days / 12053);
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  jy += ~~((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + ~~(days / 31) : 7 + ~~((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/** تاریخِ شمسیِ خوانا با ارقامِ فارسی: «۲۳ تیر ۱۴۰۴». `full=false` سال را حذف می‌کند. */
export function faJalali(iso?: string, full = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const base = `${faNum(jd)} ${JALALI_MONTHS[jm - 1]}`;
  return full ? `${base} ${faNum(jy)}` : base;
}

/** روزهای باقی‌مانده تا یک تاریخ (بر پایهٔ آغازِ روز)؛ منفی نمی‌شود. */
export function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.max(0, Math.ceil((startOf(d) - startOf(now)) / 86_400_000));
}
