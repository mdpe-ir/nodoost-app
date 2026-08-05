import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import { bazaarBilling, isAlreadyOwned } from '@/core/billing/bazaarBilling';
import { restorePurchases } from '@/core/billing/restorePurchases';
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
          let purchase;
          try {
            purchase = await bazaarBilling.purchase(bazaarSku || plan);
          } catch (err) {
            // «از قبل مالکش هستی» یعنی خریدِ قبلی هرگز به سرور نرسیده و consume نشده.
            // پیش از این این خطا هم مثلِ لغو بی‌صدا بلعیده می‌شد و کاربر برای همیشه
            // گیر می‌کرد؛ حالا همان خرید را بازیابی می‌کنیم.
            if (isAlreadyOwned(err)) {
              const s = await restorePurchases(
                {
                  restore: uc.catalog.restoreBazaarPurchase,
                  report: uc.catalog.reportBazaarSweep,
                },
                'already-owned'
              );
              await refreshUser();
              if (s.restored > 0) {
                Alert.alert(
                  'اشتراکِ شما فعال شد',
                  'خریدِ قبلیِ شما ثبت نشده بود و همین حالا فعال شد.'
                );
                return;
              }
              // بن‌بستِ واقعی: پول رفته ولی بازیابی هم جواب نداده. تا پیش از این
              // فقط می‌گفتیم «با پشتیبانی تماس بگیرید» بی‌آنکه راهی وجود داشته
              // باشد؛ حالا دکمه مستقیم تیکت را با موضوعِ پرداخت باز می‌کند.
              Alert.alert(
                'خریدِ قبلی پیدا نشد',
                'این محصول در بازار به نامِ شماست ولی فعال‌سازی نشد. پشتیبانی می‌تواند دستی بررسی‌اش کند.',
                [
                  { text: 'بعداً', style: 'cancel' },
                  {
                    text: 'تماس با پشتیبانی',
                    // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
                    onPress: () => router.push('/support' as Href),
                  },
                ]
              );
              return;
            }
            // لغوِ کاربر یا نبودِ اتصالِ بازار — بی‌صدا (کاربر خودش می‌داند).
            return;
          }
          try {
            const res = await uc.catalog.verifyBazaarPurchase(
              purchase.originalJson,
              purchase.dataSignature
            );
            // فقط بعد از ثبتِ موفق در سرور. اگر این‌جا شکست بخورد، خرید مصرف‌نشده
            // می‌ماند و جاروی بازیابی دفعه‌ی بعد سراغش می‌رود — ولی شکستش دیگر
            // بی‌صدا نیست: با beacon گزارش می‌شود (درسِ باگِ نامرئیِ ۲۰۲۶-۰۸).
            if (purchase.purchaseToken) {
              try {
                await bazaarBilling.consume(purchase.purchaseToken);
              } catch (e) {
                uc.catalog
                  .reportBazaarSweep({
                    trigger: 'purchase-consume',
                    connect_ok: true,
                    owned: 1,
                    consumed: 0,
                    errors: [String((e as Error)?.message ?? e).slice(0, 300)],
                  })
                  .catch(() => {});
              }
            } else {
              uc.catalog
                .reportBazaarSweep({
                  trigger: 'purchase-consume',
                  connect_ok: true,
                  owned: 1,
                  consumed: 0,
                  errors: ['empty purchaseToken in originalJson'],
                })
                .catch(() => {});
            }
            await refreshUser();
            await load(); // قابلیتِ خریدِ کارت‌ها با سطحِ تازه عوض می‌شود
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
    [uc, refreshUser, purchasing, install, tiers, user?.tier, user?.subscriptionUntil, load]
  );

  return { user, tiers, loading, purchasing, buy, reload: load };
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
