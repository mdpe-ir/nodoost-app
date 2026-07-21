/**
 * کاتالوگِ علاقه‌مندی‌ها — از `GET /api/config` (کلیدِ `interests`) می‌آید و منبعِ
 * چیپ‌های انتخاب در ثبت‌نام و ویرایشِ پروفایل است. `label` همان رشته‌ای است که
 * `PATCH /api/me` می‌پذیرد و در پروفایل‌ها نمایش داده می‌شود. اگر درخواستِ config
 * شکست بخورد، فهرستِ پیش‌فرضِ زیر (هم‌نسخه با seedِ بک‌اند) استفاده می‌شود.
 */
export interface InterestItem {
  slug: string;
  label: string;
}

/** سقفِ تعدادِ علاقه‌مندی‌های قابلِ‌انتخاب — هماهنگ با maxInterests در بک‌اند. */
export const MAX_INTERESTS = 10;

export const defaultInterestsCatalog: InterestItem[] = [
  { slug: 'travel', label: 'سفر' },
  { slug: 'coffee', label: 'قهوه' },
  { slug: 'music', label: 'موسیقی' },
  { slug: 'movies', label: 'فیلم' },
  { slug: 'books', label: 'کتاب' },
  { slug: 'sport', label: 'ورزش' },
  { slug: 'cooking', label: 'آشپزی' },
  { slug: 'photography', label: 'عکاسی' },
  { slug: 'nature', label: 'طبیعت' },
  { slug: 'games', label: 'بازی' },
  { slug: 'art', label: 'هنر' },
  { slug: 'animals', label: 'حیوانات' },
  { slug: 'cafe', label: 'کافه‌گردی' },
  { slug: 'tech', label: 'تکنولوژی' },
  { slug: 'yoga', label: 'یوگا' },
  { slug: 'running', label: 'دویدن' },
  { slug: 'poetry', label: 'شعر' },
  { slug: 'dance', label: 'رقص' },
  { slug: 'hiking', label: 'کوهنوردی' },
  { slug: 'gym', label: 'باشگاه' },
  { slug: 'football', label: 'فوتبال' },
  { slug: 'swimming', label: 'شنا' },
  { slug: 'cycling', label: 'دوچرخه‌سواری' },
  { slug: 'series', label: 'سریال' },
  { slug: 'podcast', label: 'پادکست' },
  { slug: 'painting', label: 'نقاشی' },
  { slug: 'writing', label: 'نویسندگی' },
  { slug: 'fashion', label: 'مد و استایل' },
  { slug: 'concert', label: 'کنسرت' },
  { slug: 'boardgame', label: 'بردگیم' },
  { slug: 'languages', label: 'زبان‌های خارجی' },
  { slug: 'meditation', label: 'مدیتیشن' },
  { slug: 'cars', label: 'ماشین' },
  { slug: 'plants', label: 'گل و گیاه' },
];

/** پاسخِ ناشناخته‌ی سرور را به فهرستِ معتبر تبدیل می‌کند؛ خالی/خراب ⇒ پیش‌فرض. */
export function parseInterestsCatalog(raw: unknown): InterestItem[] {
  if (!Array.isArray(raw)) return defaultInterestsCatalog;
  const out: InterestItem[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as InterestItem).slug === 'string' &&
      typeof (item as InterestItem).label === 'string' &&
      (item as InterestItem).label.trim() !== ''
    ) {
      out.push({ slug: (item as InterestItem).slug, label: (item as InterestItem).label });
    }
  }
  return out.length > 0 ? out : defaultInterestsCatalog;
}
