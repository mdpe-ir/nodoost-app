import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * حافظه‌ی سمتِ دستگاه برای پیام‌های درون‌برنامه‌ای.
 *
 * دو کار می‌کند:
 *  1. سیاستِ تکرارِ پیام‌های `persist_scope='client'` را اجرا می‌کند — سرور برای
 *     اینها فیلتری اعمال نمی‌کند و عمداً می‌خواهیم با ورودِ دوباره باز دیده شوند.
 *  2. برای همه‌ی پیام‌ها یادداشت می‌کند «کدام اعلان را باز کرده‌ام» تا نشانِ
 *     خوانده‌نشده درست بماند.
 *
 * با خروج از حساب پاک می‌شود؛ دقیقاً همان معنایی که `client` قرار است بدهد.
 * کلید نسخه‌دار است تا اگر شکلِ داده عوض شد، نسخه‌ی قدیمی بی‌سروصدا کنار برود.
 */
const KEY = 'nd_inapp_state_v1';
const web = Platform.OS === 'web';

/** وضعیتِ یک پیام روی این دستگاه. کلیدها کوتاه‌اند چون کلِ بلوب در یک رشته می‌رود. */
export interface DeviceMessageState {
  /** چند بار نشان داده شده. */
  n: number;
  /** بسته شده؟ */
  d?: boolean;
  /** آخرین نمایش، میلی‌ثانیه. */
  t?: number;
  /** اعلان باز شده؟ (برای نشانِ خوانده‌نشده) */
  o?: boolean;
}

type Blob = Record<string, DeviceMessageState>;

async function read(): Promise<Blob> {
  try {
    const raw = web
      ? globalThis.localStorage?.getItem(KEY)
      : await SecureStore.getItemAsync(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Blob) : {};
  } catch {
    return {};
  }
}

async function write(blob: Blob): Promise<void> {
  try {
    const raw = JSON.stringify(blob);
    if (web) {
      globalThis.localStorage?.setItem(KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(KEY, raw);
  } catch {}
}

export const inAppStateStorage = {
  load: read,

  /** یک ردیف را ادغام می‌کند (بقیه دست‌نخورده می‌مانند). */
  async patch(id: number, changes: Partial<DeviceMessageState>): Promise<Blob> {
    const blob = await read();
    const prev = blob[String(id)] ?? { n: 0 };
    blob[String(id)] = { ...prev, ...changes };
    await write(blob);
    return blob;
  },

  /**
   * شمارنده‌ی نمایش را یکی بالا می‌برد و زمانِ آخرین نمایش را می‌نویسد.
   * عمداً روی مقدارِ روی دیسک کار می‌کند نه روی حالتِ React: دو نمایشِ نزدیک
   * به هم با شمارنده‌ی کهنه‌ی closure هر دو «۱» می‌شدند.
   */
  async bump(id: number): Promise<Blob> {
    const blob = await read();
    const prev = blob[String(id)] ?? { n: 0 };
    blob[String(id)] = { ...prev, n: prev.n + 1, t: Date.now() };
    await write(blob);
    return blob;
  },

  /** خروج از حساب: پیام‌های `client` باید برای ورودِ بعدی از نو دیده شوند. */
  async clear(): Promise<void> {
    try {
      if (web) {
        globalThis.localStorage?.removeItem(KEY);
        return;
      }
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
  },
};
