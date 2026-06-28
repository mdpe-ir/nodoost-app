import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'nd_access';
const REFRESH = 'nd_refresh';

/**
 * نگه‌داریِ توکن‌ها: روی نیتیو با SecureStore (امن) و روی وب با localStorage.
 * زیرساخت است و در لایه‌ی core می‌نشیند؛ دامنه از جزئیاتش بی‌خبر است.
 */
export class TokenStorage {
  private readonly web = Platform.OS === 'web';

  private async read(key: string): Promise<string | null> {
    if (this.web) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  private async write(key: string, value: string): Promise<void> {
    if (this.web) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  }

  private async remove(key: string): Promise<void> {
    if (this.web) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }

  getAccess(): Promise<string | null> {
    return this.read(ACCESS);
  }
  getRefresh(): Promise<string | null> {
    return this.read(REFRESH);
  }
  async save(access: string, refresh?: string): Promise<void> {
    await this.write(ACCESS, access);
    if (refresh) await this.write(REFRESH, refresh);
  }
  async clear(): Promise<void> {
    await this.remove(ACCESS);
    await this.remove(REFRESH);
  }
}
