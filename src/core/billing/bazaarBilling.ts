import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * پلِ نازکِ JS به کتابخانه‌ی رسمیِ کافه‌بازار: `@cafebazaar/react-native-poolakey`.
 *
 * آن کتابخانه در زمانِ import یک `NativeEventEmitter` روی ماژولِ نیتیو می‌سازد؛ روی
 * وب/PWA این کار کرش می‌کند. برای همین با `require`ِ تنبل و فقط روی اندروید بارگذاری
 * می‌شود تا بیلدِ وب هرگز کدِ نیتیو را اجرا نکند. روی وب `isAvailable` = false می‌ماند.
 */
export interface BazaarPurchaseResult {
  productId: string;
  purchaseToken: string;
  orderId?: string;
}

interface PoolakeyModule {
  connect(rsaKey: string | null): Promise<unknown>;
  disconnect(): Promise<void>;
  purchaseProduct(sku: string): Promise<BazaarPurchaseResult>;
  getPurchasedProducts(): Promise<BazaarPurchaseResult[]>;
}

/** کلیدِ عمومیِ RSAِ برنامه از پنلِ بازار (تبِ «پرداختِ درون‌برنامه‌ای»). */
const RSA_PUBLIC_KEY: string | null =
  (Constants.expoConfig?.extra?.bazaarRsaKey as string | undefined) ??
  process.env.EXPO_PUBLIC_BAZAAR_RSA_KEY ??
  null;

let cached: PoolakeyModule | null | undefined;
let connected = false;

function load(): PoolakeyModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'android') {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@cafebazaar/react-native-poolakey').default as PoolakeyModule;
  } catch {
    cached = null;
  }
  return cached;
}

export const bazaarBilling = {
  /** آیا کتابخانه‌ی نیتیوِ بازار در این بیلد در دسترس است؟ (فقط اندرویدِ نیتیو) */
  get isAvailable() {
    return load() != null;
  },

  async connect(): Promise<void> {
    const p = load();
    if (!p) throw new Error('bazaar-billing-unavailable');
    if (connected) return;
    await p.connect(RSA_PUBLIC_KEY);
    connected = true;
  },

  async disconnect(): Promise<void> {
    const p = load();
    if (!p || !connected) return;
    await p.disconnect();
    connected = false;
  },

  /** جریانِ خریدِ یک SKU را باز می‌کند و پس از موفقیت نتیجه‌ی خرید را برمی‌گرداند. */
  async purchase(sku: string): Promise<BazaarPurchaseResult> {
    const p = load();
    if (!p) throw new Error('bazaar-billing-unavailable');
    const r = await p.purchaseProduct(sku);
    return { productId: r.productId, purchaseToken: r.purchaseToken, orderId: r.orderId };
  },

  /** خریدهای پیشینِ کاربر (برای بازیابیِ اشتراک). */
  async queryPurchases(): Promise<BazaarPurchaseResult[]> {
    const p = load();
    if (!p) return [];
    const list = await p.getPurchasedProducts();
    return list.map((r) => ({
      productId: r.productId,
      purchaseToken: r.purchaseToken,
      orderId: r.orderId,
    }));
  },
};
