import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * پلِ نازکِ JS به کتابخانه‌ی رسمیِ کافه‌بازار: `@cafebazaar/react-native-poolakey`.
 *
 * آن کتابخانه در زمانِ import یک `NativeEventEmitter` روی ماژولِ نیتیو می‌سازد؛ روی
 * وب/PWA این کار کرش می‌کند. برای همین با `require`ِ تنبل و فقط روی اندروید بارگذاری
 * می‌شود تا بیلدِ وب هرگز کدِ نیتیو را اجرا نکند. روی وب `isAvailable` = false می‌ماند.
 */
/**
 * نتیجه‌ی خرید که سرور با آن امضا را اعتبارسنجی می‌کند: خودِ دادهٔ امضاشده
 * (`originalJson`، باید بایت‌به‌بایت دست‌نخورده بماند) و امضای آن (`dataSignature`).
 */
export interface BazaarPurchaseResult {
  originalJson: string;
  dataSignature: string;
  /**
   * از داخلِ `originalJson` بیرون کشیده می‌شود (نه فیلدی جدا از پلِ نیتیو). برای
   * consume کردن بعد از تأییدِ سرور لازم است. اگر payload شکلِ غیرمنتظره داشت خالی
   * می‌ماند — آن‌وقت consume رد می‌شود و جاروی بازیابی بعداً جمعش می‌کند.
   */
  purchaseToken: string;
}

/** `purchaseToken` را از دادهٔ امضاشده می‌خواند؛ خودِ رشته دست‌نخورده می‌ماند. */
function tokenFromOriginalJson(originalJson: string): string {
  try {
    const o = JSON.parse(originalJson) as Record<string, unknown>;
    return typeof o.purchaseToken === 'string' ? o.purchaseToken : '';
  } catch {
    return '';
  }
}

/**
 * خریدی که در بازار مالِ کاربر است ولی هنوز consume نشده — یعنی هنوز به او اعتبار
 * نداده‌ایم. فهرستِ این‌ها همان صفِ بازیابیِ ماست.
 */
export interface OwnedPurchase {
  productId: string;
  purchaseToken: string;
  purchaseState: number;
}

interface PoolakeyModule {
  connect(rsaKey: string | null): Promise<unknown>;
  disconnect(): Promise<void>;
  purchaseProduct(sku: string): Promise<{ originalJson?: string; dataSignature?: string }>;
  /** خریدهای مصرف‌نشده‌ی کاربر. خروجی رشته‌ی JSONِ آرایه‌ای از originalJsonهاست. */
  getPurchasedProducts(): Promise<unknown>;
  /** بعد از ثبتِ خرید در سرور صدا زده می‌شود تا SKU دوباره قابلِ خرید شود. */
  consumePurchase(purchaseToken: string): Promise<void>;
}

/**
 * خروجیِ نیتیوِ `getPurchasedProducts` یک رشته‌ی JSON است که آرایه‌ای از
 * `originalJson`های خام را می‌دهد؛ هر عضو خودش یک شیءِ JSON است. بسته به نسخه‌ی پلِ
 * نیتیو ممکن است از قبل parse شده باشد، پس هر دو حالت را می‌پذیریم.
 */
function parseOwned(raw: unknown): OwnedPurchase[] {
  let list: unknown = raw;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const out: OwnedPurchase[] = [];
  for (const entry of list) {
    let o: unknown = entry;
    if (typeof o === 'string') {
      try {
        o = JSON.parse(o);
      } catch {
        continue;
      }
    }
    if (!o || typeof o !== 'object') continue;
    const r = o as Record<string, unknown>;
    const productId = typeof r.productId === 'string' ? r.productId : '';
    const purchaseToken = typeof r.purchaseToken === 'string' ? r.purchaseToken : '';
    // purchaseState غایب ⇒ صفر (خریداری‌شده) فرض می‌شود؛ بازار فقط برای مرجوعی مقدار می‌دهد.
    const purchaseState = typeof r.purchaseState === 'number' ? r.purchaseState : 0;
    if (productId && purchaseToken) out.push({ productId, purchaseToken, purchaseState });
  }
  return out;
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

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * فاصله‌ی پیش از هر تلاشِ اتصال. تلاشِ اول فوری است؛ بعدی‌ها با کمی صبر، چون
 * شکستِ اتصال معمولاً یعنی سرویسِ بازار هنوز بالا نیامده (cold start) و بلافاصله
 * دوباره کوبیدن فایده ندارد.
 */
const CONNECT_BACKOFF_MS = [0, 1000, 3000];

export const bazaarBilling = {
  /** آیا کتابخانه‌ی نیتیوِ بازار در این بیلد در دسترس است؟ (فقط اندرویدِ نیتیو) */
  get isAvailable() {
    return load() != null;
  },

  /**
   * با چند تلاش وصل می‌شود؛ فقط وقتی resolve می‌شود که اتصال واقعاً برقرار باشد.
   *
   * تاریخچه: wrapperِ کتابخانه دو باگ داشت که با patch-package بسته‌ایم — خطای
   * connect را می‌بلعید («موفقِ» دروغین) و یک Promiseِ ردشده را برای همیشه کش
   * می‌کرد (بعد از یک شکست، همه‌ی فراخوانی‌های بعدی تا مرگِ پروسه رد می‌شدند).
   * جاروی بازیابی دقیقاً به همین دو دلیل هفته‌ها بی‌صدا مرده بود.
   */
  async connect(): Promise<void> {
    const p = load();
    if (!p) throw new Error('bazaar-billing-unavailable');
    if (connected) return;
    let lastErr: unknown;
    for (const wait of CONNECT_BACKOFF_MS) {
      if (wait > 0) await delay(wait);
      try {
        await p.connect(RSA_PUBLIC_KEY);
        connected = true;
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  },

  async disconnect(): Promise<void> {
    const p = load();
    if (!p || !connected) return;
    await p.disconnect();
    connected = false;
  },

  /**
   * اتصال را از نو می‌سازد. برای وقتی که سرویسِ بازار وسطِ کار قطع شده (برگشتن از
   * صفحه‌ی پرداخت این را زیاد پیش می‌آورد) و فراخوانیِ بعدی با اتصالِ مرده‌ی
   * «به‌ظاهر وصل» شکست می‌خورد.
   */
  async forceReconnect(): Promise<void> {
    const p = load();
    if (!p) throw new Error('bazaar-billing-unavailable');
    try {
      await p.disconnect();
    } catch {
      /* قطعِ اتصالِ مرده مهم نیست */
    }
    connected = false;
    await bazaarBilling.connect();
  },

  /** جریانِ خریدِ یک SKU را باز می‌کند و پس از موفقیت دادهٔ امضاشده + امضا را برمی‌گرداند. */
  async purchase(sku: string): Promise<BazaarPurchaseResult> {
    const p = load();
    if (!p) throw new Error('bazaar-billing-unavailable');
    const r = await p.purchaseProduct(sku);
    if (!r?.originalJson || !r?.dataSignature) throw new Error('bazaar-purchase-unsigned');
    return {
      originalJson: r.originalJson,
      dataSignature: r.dataSignature,
      purchaseToken: tokenFromOriginalJson(r.originalJson),
    };
  },

  /**
   * خریدهایی که هنوز consume نشده‌اند. چون فقط بعد از ثبتِ موفق در سرور consume
   * می‌کنیم، هر چه این‌جا می‌ماند یعنی «پول داده ولی اعتبار نگرفته».
   */
  async getPurchases(): Promise<OwnedPurchase[]> {
    const p = load();
    if (!p) return [];
    return parseOwned(await p.getPurchasedProducts());
  },

  /**
   * خرید را مصرف‌شده اعلام می‌کند. دو کار می‌کند: از صفِ بازیابی خارجش می‌کند، و
   * SKU را دوباره قابلِ خرید می‌کند تا تمدیدِ ماهِ بعد ITEM_ALREADY_OWNED نگیرد.
   *
   * روی شکست یک‌بار با اتصالِ تازه دوباره تلاش می‌کند: پرتکرارترین علتِ شکست،
   * اتصالِ مرده بعد از برگشتن از صفحه‌ی پرداختِ بازار است.
   */
  async consume(purchaseToken: string): Promise<void> {
    const p = load();
    if (!p) return;
    try {
      await p.consumePurchase(purchaseToken);
    } catch {
      await bazaarBilling.forceReconnect();
      await p.consumePurchase(purchaseToken);
    }
  },
};

/** آیا این خطا یعنی «کاربر از قبل مالکِ این SKU است»؟ */
export function isAlreadyOwned(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  return msg.includes('already') && msg.includes('own');
}
