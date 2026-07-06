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
