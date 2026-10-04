import { enNum, faNum } from './faNum';

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

/** Years at which the 33-year leap cycle shifts. Valid range: 1178–3177 Jalali. */
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
  2394, 2456, 3178,
];

type LeapInfo = { leap: number; gy: number; march: number };

function jalaliCal(jy: number): LeapInfo {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0] as number;

  if (jy < jp || jy >= (BREAKS[BREAKS.length - 1] as number)) {
    throw new RangeError(`jalali year out of range: ${jy}`);
  }

  let jump = 0;
  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i] as number;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** Gregorian → Julian Day Number. */
function gregorianToJdn(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** Julian Day Number → Gregorian. */
function jdnToGregorian(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function isLeapJalaliYear(year: number): boolean {
  return jalaliCal(year).leap === 0;
}

/** 31 for the first six months, 30 for the next five, 29 or 30 for Esfand. */
export function jalaliMonthLength(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isLeapJalaliYear(year) ? 30 : 29;
}

export function jalaliToGregorian({ year, month, day }: JalaliDate): { gy: number; gm: number; gd: number } {
  const cal = jalaliCal(year);
  const jdn =
    gregorianToJdn(cal.gy, 3, cal.march) +
    (month - 1) * 31 -
    div(month, 7) * (month - 7) +
    day -
    1;
  return jdnToGregorian(jdn);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const jdn = gregorianToJdn(gy, gm, gd);
  let jy = jdnToGregorian(jdn).gy - 621;
  const cal = jalaliCal(jy);
  const firstDayOfYear = gregorianToJdn(cal.gy, 3, cal.march);

  let k = jdn - firstDayOfYear;
  if (k >= 0) {
    if (k <= 185) return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (cal.leap === 1) k += 1;
  }
  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

export function isValidJalaliDate(date?: JalaliDate | null): boolean {
  if (!date) return false;
  const { year, month, day } = date;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1178 || year > 3177) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= jalaliMonthLength(year, month);
}

/**
 * Converts a stored Gregorian ISO date string (YYYY-MM-DD) to a JalaliDate.
 * Timezone-safe date-only parsing without `new Date(iso)`.
 */
export function isoToJalali(iso?: string | null): JalaliDate | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return undefined;
  try {
    return gregorianToJalali(Number(match[1]), Number(match[2]), Number(match[3]));
  } catch {
    return undefined;
  }
}

/**
 * Converts a JalaliDate to Gregorian ISO date string (YYYY-MM-DD).
 */
export function jalaliToIso(date: JalaliDate): string | undefined {
  if (!isValidJalaliDate(date)) return undefined;
  try {
    const { gy, gm, gd } = jalaliToGregorian(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${gy}-${pad(gm)}-${pad(gd)}`;
  } catch {
    return undefined;
  }
}

export function formatJalali(date?: JalaliDate): string {
  return date ? `${faNum(date.year)}/${faNum(String(date.month).padStart(2, '0'))}/${faNum(String(date.day).padStart(2, '0'))}` : '';
}

export function parseJalaliInput(value: string): JalaliDate | undefined {
  const values = enNum(value).replace(/[^0-9/]/g, '').split('/').map(Number);
  if (values.length !== 3 || values.some((n) => !Number.isFinite(n))) return undefined;
  const [year, month, day] = values;
  return isValidJalaliDate({ year, month, day }) ? { year, month, day } : undefined;
}

/**
 * Calculate age in full years from a Gregorian ISO birthdate (YYYY-MM-DD).
 * Timezone-safe: parsed via regex rather than Date constructor.
 */
export function ageFromBirthdate(iso?: string | null, today = new Date()): number | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : undefined;
}
