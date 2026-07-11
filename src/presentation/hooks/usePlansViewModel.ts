import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import { bazaarBilling } from '@/core/billing/bazaarBilling';
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
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTiers(await uc.catalog.getTiers());
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
      // وب/PWA: پرداخت فقط داخلِ APK ممکن است. اگر ادمین اجبار کرده باشد، به‌جای
      // زرین‌پال کاربر را به صفحه‌ی «برای خرید، اپ را نصب کن» می‌بریم.
      if (Platform.OS === 'web' && install.forceAppForPayments) {
        router.push({ pathname: '/get-app', params: { reason: 'purchase' } });
        return;
      }
      setPurchasing(plan);
      try {
        if (getPaymentMode() === 'bazaar') {
          // بیلدِ کافه‌بازار: خریدِ درون‌برنامه‌ای (Poolakey) سپس اعتبارسنجیِ سرور.
          await bazaarBilling.connect();
          let purchase;
          try {
            purchase = await bazaarBilling.purchase(bazaarSku || plan);
          } catch {
            // لغوِ کاربر یا نبودِ اتصالِ بازار — بی‌صدا (کاربر خودش می‌داند).
            return;
          }
          try {
            await uc.catalog.verifyBazaarPurchase(purchase.originalJson, purchase.dataSignature);
            await refreshUser();
          } catch {
            // پرداخت انجام شد ولی تأییدِ سرور شکست خورد — کاربر باید بداند و بتواند
            // دوباره تلاش کند (جریان idempotent است؛ همان توکن دوباره تأیید می‌شود).
            Alert.alert(
              'تأییدِ خرید ناموفق بود',
              'پرداختِ شما انجام شد اما فعال‌سازیِ اشتراک با خطا روبه‌رو شد. لطفاً چند لحظه بعد دوباره «خرید» را بزنید؛ اگر برطرف نشد با پشتیبانی تماس بگیرید.'
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
    [uc, refreshUser, purchasing, install]
  );

  return { user, tiers, loading, purchasing, buy, reload: load };
}
