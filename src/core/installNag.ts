import { Platform } from 'react-native';

/**
 * شمارنده‌ی «کنش‌های معنادار» برای یادآورِ نصبِ اپِ اندروید (حالتِ nag).
 *
 * به‌جای context، یک ماژولِ سراسریِ سبک است تا viewmodelها (ارسالِ پیام، لایک، …)
 * بدونِ وابستگی به درختِ React بتوانند کنش ثبت کنند؛ AndroidAppGateProvider مشترکِ
 * تغییرات می‌شود و تصمیمِ نمایشِ یادآور را می‌گیرد.
 *
 * شمارش فقط روی وب معنا دارد (نیتیو یعنی اپ نصب است) و در localStorage می‌ماند تا
 * بازکردنِ دوباره‌ی PWA شمارش را صفر نکند.
 */

const KEY_ACTIONS = 'androidGate:actions';
const KEY_DISMISSALS = 'androidGate:dismissals';

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

function readInt(key: string): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const n = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeInt(key: string, value: number) {
  try {
    localStorage?.setItem(key, String(value));
  } catch {
    /* حالتِ خصوصیِ مرورگر — بی‌خیال */
  }
}

export function readInstallNagActions(): number {
  return readInt(KEY_ACTIONS);
}

export function readInstallNagDismissals(): number {
  return readInt(KEY_DISMISSALS);
}

/** یک «بستنِ» یادآور را ثبت می‌کند تا لحنِ دفعه‌های بعد پله‌پله جدی‌تر شود. */
export function bumpInstallNagDismissals(): number {
  const next = readInt(KEY_DISMISSALS) + 1;
  writeInt(KEY_DISMISSALS, next);
  return next;
}

/**
 * ثبتِ یک کنشِ معنادار (ارسالِ پیام، لایک، …). روی نیتیو no-op است؛ تشخیصِ
 * اندرویدبودن و روشن‌بودنِ حالتِ nag با خودِ Provider است، اینجا فقط می‌شماریم.
 */
export function recordInstallNagAction(): void {
  if (Platform.OS !== 'web') return;
  const next = readInt(KEY_ACTIONS) + 1;
  writeInt(KEY_ACTIONS, next);
  listeners.forEach((l) => l(next));
}

export function subscribeInstallNag(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
