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

export interface InstallConfig {
  /** اگر true باشد، دکمه‌ی خرید در وب به صفحه‌ی «نصبِ اپ» می‌رود (به‌جای زرین‌پال). */
  forceAppForPayments: boolean;
  /** اگر true باشد، کاربرانِ اندرویدیِ PWA پس از مدتی برای ادامه به نصبِ اپ مسدود می‌شوند. */
  androidPwaGate: boolean;
  methods: InstallMethod[];
}

export const emptyInstallConfig: InstallConfig = {
  forceAppForPayments: false,
  androidPwaGate: false,
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
  return {
    forceAppForPayments: Boolean(o.force_app_for_payments),
    androidPwaGate: Boolean(o.android_pwa_gate),
    methods,
  };
}

/** فقط روش‌هایی که فعال‌اند و آدرس دارند — همان چیزی که باید به کاربر نشان داد. */
export function usableMethods(cfg: InstallConfig | null): InstallMethod[] {
  return (cfg?.methods ?? []).filter((m) => m.enabled && m.url);
}
