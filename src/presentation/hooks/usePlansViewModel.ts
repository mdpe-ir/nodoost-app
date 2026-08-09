import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { invalidateTierCatalog } from '@/presentation/hooks/useTierCatalog';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import {
  bazaarBilling,
  isAlreadyOwned,
  type BazaarPurchaseResult,
} from '@/core/billing/bazaarBilling';
import { restorePurchases, type RestoreDeps } from '@/core/billing/restorePurchases';
import { clearPendingReceipt, savePendingReceipt } from '@/core/billing/pendingReceipts';
import { flushPendingConsumes, pendingConsumeFor, queueConsume } from '@/core/billing/pendingConsumes';
import { purchaseResultMessage, upgradeConfirm } from '@/presentation/tiers/subscriptionCopy';
import type { Tier } from '@/domain/entities';

/**
 * ویومدلِ سبکِ صفحه‌ی سطح‌های اشتراک — فقط تایرها + خرید. مشترکِ صفحه‌ی «سطح‌ها»
 * و پنجره‌ی ارتقا (paywall). جدا از useProfileViewModel است تا بدونِ بارِ عکس/بیو
 * هم قابلِ استفاده باشد. `purchasing` کدِ پلنِ در حالِ خرید را نگه می‌دارد تا فقط
 * دکمه‌ی همان کارت لودینگ شود.
 */
export function usePlansViewModel() {
  const uc = useCases();
  const { user, refreshUser } = useSession();
  const { install } = useRemoteConfig();
  const { refresh: refreshQuota } = useQuota();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await uc.catalog.getTiers();
      setTiers(list);
      // کشِ مشترکِ پنجره‌ی ارتقا هم باید همین فهرست را ببیند (قابلیتِ خرید و
      // روزهای صف با سطحِ کاربر عوض می‌شوند).
      invalidateTierCatalog();
    } catch {
      /* نادیده */
    } finally {
      setLoading(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);


  const buy = useCallback(
    async (plan: string, bazaarSku?: string) => {
      if (purchasing) return;
      const target = tiers.find((t) => t.id === plan || t.bazaarSku === plan);

      // دفاعِ لایه‌ی دوم: کارتِ سطحِ پایین‌تر از قبل غیرفعال است، ولی اگر از هر
      // مسیرِ دیگری به این‌جا رسید، پیش از باز کردنِ درگاه متوقفش کن — رد کردن
      // *قبل* از پرداخت بی‌ضرر است، برخلافِ رد کردنِ بعد از آن.
      if (target && target.purchasable === false) {
        Alert.alert(
          'این سطح فعلاً قابلِ خرید نیست',
          target.blockMessage ||
            'با اشتراکِ فعالِ فعلی‌تان، خریدِ این سطح ممکن نیست. پس از پایانِ اشتراکِ فعلی دوباره امتحان کنید.'
        );
        return;
      }

      // وب/PWA: پرداخت فقط داخلِ APK ممکن است. اگر ادمین اجبار کرده باشد، به‌جای
      // زرین‌پال کاربر را به صفحه‌ی «برای خرید، اپ را نصب کن» می‌بریم.
      if (Platform.OS === 'web' && install.forceAppForPayments) {
        router.push({ pathname: '/get-app', params: { reason: 'purchase' } });
        return;
      }

      // ارتقا وسطِ یک اشتراکِ فعال: قولِ «روزهایت حفظ می‌شود» باید *پیش از* پرداخت
      // داده شود، وگرنه کاربر با ترسِ سوختنِ روزها اصلاً ارتقا نمی‌دهد.
      // عمداً این‌جا (زمانِ کلیک) حساب می‌شود نه در رندر: خواندنِ ساعت در رندر
      // ناخالص است و شمارشِ روز هم باید در لحظه‌ی تصمیم دقیق باشد.
      const daysLeft = remainingDays(user?.subscriptionUntil, user?.tier);
      if (target && daysLeft > 0) {
        const confirm = upgradeConfirm(tiers, target, user?.tier ?? 1, daysLeft);
        if (confirm) {
          const go = await new Promise<boolean>((resolve) => {
            Alert.alert(confirm.title, confirm.message, [
              { text: 'انصراف', style: 'cancel', onPress: () => resolve(false) },
              { text: 'ادامه و پرداخت', onPress: () => resolve(true) },
            ]);
          });
          if (!go) return;
        }
      }

      setPurchasing(plan);
      try {
        if (getPaymentMode() === 'bazaar') {
          // بیلدِ کافه‌بازار: خریدِ درون‌برنامه‌ای (Poolakey) سپس اعتبارسنجیِ سرور.
          await bazaarBilling.connect();
          const sku = bazaarSku || plan;
          const purchase = await openPurchase(sku, {
            restore: uc.catalog.restoreBazaarPurchase,
            report: uc.catalog.reportBazaarSweep,
            refreshUser,
          });
          if (!purchase) return; // لغو، بن‌بستِ اعلام‌شده، یا خطای اعلام‌شده
          // پیش از هر چیز، رسیدِ امضاشده روی دیسک. اگر اپ همین‌جا کشته شود یا
          // تأیید نگیرد، همین ردیف تنها ردِ باقی‌مانده از پرداخت است — و برخلافِ
          // صفِ بازار، خواندنش به هیچ APIی وابسته نیست.
          savePendingReceipt({
            originalJson: purchase.originalJson,
            dataSignature: purchase.dataSignature,
            productId: sku,
            purchaseToken: purchase.purchaseToken,
          });
          try {
            const res = await uc.catalog.verifyBazaarPurchase(
              purchase.originalJson,
              purchase.dataSignature
            );
            clearPendingReceipt(purchase.originalJson);
            // فقط بعد از ثبتِ موفق در سرور. مصرف به صفِ خودش می‌رود به‌جای صدا
            // زدنِ همین‌جا: هر ۱۰ شکستِ ثبت‌شده‌ی consume در تولید دقیقاً در همین
            // لحظه رخ داده بود — تا وقتی اتصالِ بازار بعد از برگشت از صفحه‌ی
            // پرداخت جا نیفتاده. صف در آرامشِ پیش‌زمینه و با تکرار همان کار را می‌کند.
            queueConsume(purchase.purchaseToken, sku);
            void flushPendingConsumes();
            await refreshUser();
            await load(); // قابلیتِ خریدِ کارت‌ها با سطحِ تازه عوض می‌شود
            // سقف‌های تازه باید فوراً در نوارهای سهمیه دیده شوند، وگرنه کاربر
            // بلافاصله بعد از خرید همان «۰ مانده»ی قبلی را می‌بیند.
            refreshQuota();
            // پیام از روی کاری که سرور واقعاً کرد نوشته می‌شود، نه حدسِ اپ.
            const msg = purchaseResultMessage(tiers, res);
            Alert.alert(msg.title, msg.message);
          } catch {
            // پرداخت انجام شد ولی تأییدِ سرور شکست خورد. خرید مصرف نشده، پس در صفِ
            // بازیابی می‌ماند و دفعه‌ی بعدی که اپ باز شود خودکار فعال می‌شود.
            Alert.alert(
              'تأییدِ خرید کمی طول می‌کشد',
              'پرداختِ شما انجام شد. فعال‌سازی همین حالا ممکن نشد، اما خریدِ شما محفوظ است و دفعه‌ی بعد که اپ را باز کنید خودکار فعال می‌شود.'
            );
          }
          return;
        }
        // وب/PWA: بازآوردِ زرین‌پال در مرورگر.
        const { payUrl } = await uc.catalog.startPayment(plan);
        if (payUrl) await WebBrowser.openBrowserAsync(payUrl);
      } catch {
        /* نادیده */
      } finally {
        setPurchasing(null);
      }
    },
    [
      uc,
      refreshUser,
      refreshQuota,
      purchasing,
      install,
      tiers,
      user?.tier,
      user?.subscriptionUntil,
      load,
    ]
  );

  return { user, tiers, loading, purchasing, buy, reload: load };
}

/**
 * جریانِ خرید را باز می‌کند و رسیدِ امضاشده را برمی‌گرداند — یا null اگر چیزی برای
 * تأیید نماند (لغوِ کاربر، یا حالتی که خودش به کاربر اعلام شده).
 *
 * سختیِ واقعی این‌جاست: `ITEM_ALREADY_OWNED`. چون consume روی دستگاهِ کاربران
 * معمولاً شکست می‌خورد، خریدِ ماهِ قبل در بازار «مالِ کاربر» می‌ماند و **تمدید را
 * مسدود می‌کند**. تا پیش از این، تنها پاسخ‌مان جاروی بازار بود که خودش هم روی
 * همان دستگاه‌ها جواب نمی‌دهد؛ یعنی بن‌بستِ کامل.
 */
async function openPurchase(
  sku: string,
  deps: RestoreDeps & { refreshUser: () => Promise<unknown> | void }
): Promise<BazaarPurchaseResult | null> {
  try {
    return await bazaarBilling.purchase(sku);
  } catch (err) {
    if (!isAlreadyOwned(err)) return null; // لغوِ کاربر یا نبودِ بازار — بی‌صدا
  }

  // ۱) محتمل‌ترین حالت: خریدِ قبلی ثبت شده ولی مصرف نشده، و خودمان توکنش را داریم.
  // آزادش کن و بلافاصله همان خرید را دوباره باز کن. (صفِ مصرف فقط رسیدهای
  // *پذیرفته‌شده‌ی سرور* را نگه می‌دارد، پس مصرفشان هیچ پولی را از بین نمی‌برد.)
  if (pendingConsumeFor(sku)) {
    await flushPendingConsumes();
    if (!pendingConsumeFor(sku)) {
      try {
        return await bazaarBilling.purchase(sku);
      } catch {
        /* باز هم نشد — برو سراغِ مسیرهای بعدی */
      }
    }
  }

  // ۲) شاید خریدِ قبلی اصلاً به سرور نرسیده بود. روی دستگاه‌هایی که صفِ بازار
  // خوانده می‌شود، همین‌جا فعال می‌شود.
  const s = await restorePurchases(deps, 'already-owned');
  await deps.refreshUser();
  if (s.restored > 0) {
    Alert.alert('اشتراکِ شما فعال شد', 'خریدِ قبلیِ شما ثبت نشده بود و همین حالا فعال شد.');
    return null;
  }

  // ۳) بن‌بست — ولی نه بن‌بستِ خالی: تیکت با متنِ از پیش پرشده باز می‌شود تا
  // پشتیبانی SKU را داشته باشد و کاربر مجبور نباشد ماجرا را توضیح بدهد.
  Alert.alert(
    'این محصول از قبل به نامِ شماست',
    'بازار می‌گوید این محصول را قبلاً خریده‌اید، ولی فعال‌سازی‌اش این‌جا ممکن نشد. پشتیبانی می‌تواند دستی بررسی و فعالش کند.',
    [
      { text: 'بعداً', style: 'cancel' },
      {
        text: 'تماس با پشتیبانی',
        // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
        onPress: () =>
          router.push({
            pathname: '/support',
            params: { draft: alreadyOwnedTicket(sku) },
          } as Href),
      },
    ]
  );
  return null;
}

/** متنِ آماده‌ی تیکت — همان چیزی که پشتیبانی برای جبرانِ دستی لازم دارد. */
function alreadyOwnedTicket(sku: string): string {
  return (
    `سلام. هنگامِ خریدِ «${sku}» پیامِ «این محصول از قبل خریداری شده» می‌گیرم ` +
    `و اشتراکم فعال نمی‌شود. لطفاً بررسی کنید.\n(کدِ پیگیری: already-owned/${sku})`
  );
}

/**
 * روزهای باقی‌ماندهٔ اشتراکِ فعال، رو به بالا گرد — تا با شمارشِ سرور بخواند
 * («۱ روز مانده» بهتر از «۰ روز» است). صفر یعنی اشتراکِ فعالی برای حفظ نیست.
 */
function remainingDays(until?: string, tier?: number): number {
  if (!until || (tier ?? 1) <= 1) return 0;
  const ms = new Date(until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}
