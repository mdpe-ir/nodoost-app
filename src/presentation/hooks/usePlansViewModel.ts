import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import { bazaarBilling, isAlreadyOwned } from '@/core/billing/bazaarBilling';
import { restorePurchases } from '@/core/billing/restorePurchases';
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
          } catch (err) {
            // «از قبل مالکش هستی» یعنی خریدِ قبلی هرگز به سرور نرسیده و consume نشده.
            // پیش از این این خطا هم مثلِ لغو بی‌صدا بلعیده می‌شد و کاربر برای همیشه
            // گیر می‌کرد؛ حالا همان خرید را بازیابی می‌کنیم.
            if (isAlreadyOwned(err)) {
              const s = await restorePurchases({ restore: uc.catalog.restoreBazaarPurchase });
              await refreshUser();
              Alert.alert(
                s.restored > 0 ? 'اشتراکِ شما فعال شد' : 'خریدِ قبلی پیدا نشد',
                s.restored > 0
                  ? 'خریدِ قبلیِ شما ثبت نشده بود و همین حالا فعال شد.'
                  : 'این محصول در بازار به نامِ شماست ولی فعال‌سازی نشد. لطفاً با پشتیبانی تماس بگیرید.'
              );
              return;
            }
            // لغوِ کاربر یا نبودِ اتصالِ بازار — بی‌صدا (کاربر خودش می‌داند).
            return;
          }
          try {
            await uc.catalog.verifyBazaarPurchase(purchase.originalJson, purchase.dataSignature);
            // فقط بعد از ثبتِ موفق در سرور. اگر این‌جا شکست بخورد، خرید مصرف‌نشده
            // می‌ماند و جاروی بازیابی دفعه‌ی بعد سراغش می‌رود.
            if (purchase.purchaseToken) {
              try {
                await bazaarBilling.consume(purchase.purchaseToken);
              } catch {
                /* دورِ بعد */
              }
            }
            await refreshUser();
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
    [uc, refreshUser, purchasing, install]
  );

  return { user, tiers, loading, purchasing, buy, reload: load };
}
