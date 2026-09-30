import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';

/**
 * شناسه‌ی پایدارِ همین نصب — یک‌بار ساخته و ماندگار می‌شود.
 *
 * سرور از آن برای گروه‌بندیِ نشست‌ها («دستگاه‌های متصل») و سنجشِ سقفِ تعدادِ
 * اکانت روی هر دستگاه استفاده می‌کند. صادقانه: شناسه‌ی سمتِ کلاینت است، پس یک
 * محدودیتِ نرم است نه یک گاردِ امنیتی — کسی که بخواهد، می‌تواند پاکش کند.
 */
const KEY = 'nd_device_id_v1';
const web = Platform.OS === 'web';

let cached: string | null = null;

async function read(): Promise<string | null> {
  try {
    if (web) return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function write(value: string): Promise<void> {
  try {
    if (web) {
      globalThis.localStorage?.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    /* اگر ذخیره نشد، شناسه‌ی همین نشستِ حافظه کافی است */
  }
}

/** شناسه‌ی دستگاه؛ در بدترین حالت (خطای ذخیره) رشته‌ی موقتِ درون‌حافظه‌ای. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const existing = await read();
  if (existing) {
    cached = existing;
    return existing;
  }
  const fresh = randomUUID();
  await write(fresh);
  cached = fresh;
  return fresh;
}
