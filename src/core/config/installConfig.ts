/**
 * پیکربندیِ روش‌های نصبِ اپِ اندروید — از `GET /api/config` (کلیدِ `install`) می‌آید و
 * کاملاً از پنلِ ادمین ویرایش می‌شود. در نسخه‌ی وب/PWA پرداخت فقط داخلِ APK کار می‌کند،
 * پس این پیکربندی تعیین می‌کند خرید کجا برود و اپِ نیتیو چطور به کاربر معرفی شود.
 */
export type InstallMethodKey = 'bazaar' | 'myket' | 'direct';

export interface InstallMethod {
  key: InstallMethodKey;
  label: string;
  url: string;
  enabled: boolean;
}

/**
 * رفتارِ وبِ اندروید نسبت به نصبِ اپ:
 * - `off`: هیچ.
 * - `nag`: یادآورِ قابلِ‌بستن که پس از چند کنشِ معنادار ظاهر و مدام تکرار می‌شود.
 * - `block`: صفحه‌ی مسدودکننده‌ی تمام‌صفحه (رفتارِ قدیمی).
 */
export type AndroidGateMode = 'off' | 'nag' | 'block';

export interface InstallConfig {
  /** اگر true باشد، دکمه‌ی خرید در وب به صفحه‌ی «نصبِ اپ» می‌رود (به‌جای زرین‌پال). */
  forceAppForPayments: boolean;
  androidGateMode: AndroidGateMode;
  /** از چندمین کنشِ معنادار (پیام، لایک، …) اولین یادآور نشان داده شود. */
  nagStartAfter: number;
  /** پس از اولین یادآور، هر چند کنش یک‌بار دوباره ظاهر شود. */
  nagEvery: number;
  /** متنِ دلخواهِ ادمین برای یادآور؛ خالی ⇒ متن‌های پله‌ایِ پیش‌فرضِ اپ. */
  nagTitle: string;
  nagBody: string;
  methods: InstallMethod[];
}

export const emptyInstallConfig: InstallConfig = {
  forceAppForPayments: false,
  androidGateMode: 'off',
  nagStartAfter: 3,
  nagEvery: 3,
  nagTitle: '',
  nagBody: '',
  methods: [],
};

/** نگاشتِ پاسخِ خامِ سرور (snake_case) به مدلِ اپ؛ در برابرِ فیلدهای گم‌شده مقاوم. */
export function parseInstallConfig(raw: unknown): InstallConfig {
  const o = (raw ?? {}) as Record<string, unknown>;
  const methodsRaw = Array.isArray(o.methods) ? o.methods : [];
  const methods: InstallMethod[] = methodsRaw
    .map((m) => {
      const mm = (m ?? {}) as Record<string, unknown>;
      return {
        key: String(mm.key ?? '') as InstallMethodKey,
        label: String(mm.label ?? ''),
        url: String(mm.url ?? '').trim(),
        enabled: Boolean(mm.enabled),
      };
    })
    .filter((m) => m.key);
  // سرورهای قدیمی فقط bool می‌فرستند؛ mode نامعتبر از همان مشتق می‌شود.
  const rawMode = String(o.android_gate_mode ?? '');
  const mode: AndroidGateMode =
    rawMode === 'off' || rawMode === 'nag' || rawMode === 'block'
      ? rawMode
      : o.android_pwa_gate
        ? 'block'
        : 'off';
  const positiveInt = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : fallback;
  };
  return {
    forceAppForPayments: Boolean(o.force_app_for_payments),
    androidGateMode: mode,
    nagStartAfter: positiveInt(o.nag_start_after, 3),
    nagEvery: positiveInt(o.nag_every, 3),
    nagTitle: String(o.nag_title ?? '').trim(),
    nagBody: String(o.nag_body ?? '').trim(),
    methods,
  };
}

/** فقط روش‌هایی که فعال‌اند و آدرس دارند — همان چیزی که باید به کاربر نشان داد. */
export function usableMethods(cfg: InstallConfig | null): InstallMethod[] {
  return (cfg?.methods ?? []).filter((m) => m.enabled && m.url);
}
