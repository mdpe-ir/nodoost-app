/**
 * پالتِ لوکسِ تیره — هویتِ بصریِ نودوست.
 * نسخه‌ی مدرن‌شده: خنثی‌های بنفش‌ذغالیِ عمیق‌تر + رزِ پررنگ‌تر؛
 * طلایی ثابت است (لوگو و آیکن‌های PNG طلایی‌اند).
 */
export const colors = {
  bg: '#0B0910',
  surface: '#16121C',
  surface2: '#1E1826',
  line: '#2A2333',
  ink: '#F4EEE6',
  ink2: '#B2A8B0',
  ink3: '#786F82',
  gold: '#DAB877',
  gold2: '#F2DCA8',
  goldSoft: 'rgba(218,184,119,0.35)',
  goldFaint: 'rgba(218,184,119,0.12)',
  rose: '#FF5C7A',
  roseFaint: 'rgba(255,92,122,0.14)',
  ok: '#5FC98A',
  onGold: '#2A1D12',
  /** متن روی عکس (اسکریمِ تیره زیرش هست). */
  onPhoto: '#FFFFFF',
  onPhotoDim: 'rgba(255,255,255,0.88)',
  /** پوششِ تمام‌صفحه (مثلاً پشتِ کارتِ مچ). */
  overlay: 'rgba(10,8,14,0.9)',
  /** پس‌زمینه‌ی نیمه‌شفافِ پشتِ برگه‌ها. */
  backdrop: 'rgba(7,5,11,0.65)',
  /** رنگِ سطح‌های عضویت: ۱ عادی، ۲ برنزی، ۳ نقره‌ای، ۴ طلایی، ۵ الماس. */
  tierNormal: '#9A93A5',
  tierBronze: '#C4874F',
  tierSilver: '#C9CDD6',
  tierGold: '#DAB877',
  tierDiamond: '#8FB7F2',
} as const;

export type ColorKey = keyof typeof colors;
