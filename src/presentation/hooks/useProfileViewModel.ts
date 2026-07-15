import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import { bazaarBilling } from '@/core/billing/bazaarBilling';
import { normalizeImage } from '@/core/media/normalizeImage';
import { resolveLocation } from '@/core/utils/location';
import type { Photo, Tier, UserPreferences } from '@/domain/entities';

/** ویومدلِ پروفایل: عکس‌ها، تایرها، ویرایشِ نام/بیو، آپلود/حذفِ عکس، خرید، خروج. */
export function useProfileViewModel() {
  const uc = useCases();
  const { user, refreshUser, logout } = useSession();
  const { install } = useRemoteConfig();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [travelBusy, setTravelBusy] = useState(false);

  // — ویرایشِ نام و بیو —
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  // کلیدِ تنظیمی که همین حالا در حالِ ذخیره است — تا فقط رویِ همان ردیف لودر نشان دهیم.
  const [savingPref, setSavingPref] = useState<string | null>(null);

  useEffect(() => {
    setDraftName(user?.name ?? '');
    setDraftBio(user?.bio ?? '');
    // فقط وقتی هویتِ کاربر عوض می‌شود مقداردهی کن، نه وسطِ تایپ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dirty =
    draftName.trim() !== (user?.name ?? '') || draftBio.trim() !== (user?.bio ?? '');

  const saveProfile = useCallback(async () => {
    if (draftName.trim().length < 2) return;
    setSaving(true);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({ name: draftName.trim(), bio: draftBio.trim() });
      await refreshUser();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftName, draftBio, uc, refreshUser]);

  /** به‌روزرسانیِ هر زیرمجموعه‌ای از تنظیماتِ حریمِ خصوصی (سرور prefs را merge می‌کند). */
  const updatePrefs = useCallback(async (partial: Partial<UserPreferences>, key?: string) => {
    setPrivacySaving(true);
    setSavingPref(key ?? Object.keys(partial)[0] ?? null);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({ prefs: partial });
      await refreshUser();
    } catch {
      setSaveError(true);
    } finally {
      setPrivacySaving(false);
      setSavingPref(null);
    }
  }, [uc, refreshUser]);

  const updateMapPrivacy = useCallback(
    (showExactLocationOnMap: boolean) =>
      updatePrefs(
        {
          showOnMap: user?.prefs?.showOnMap ?? true,
          showExactLocationOnMap,
        },
        'showExactLocationOnMap'
      ),
    [updatePrefs, user]
  );

  /** حالتِ سفر (الماس): قفلِ موقعیت روی شهرِ انتخابی. */
  const startTravel = useCallback(
    async (lat: number, lng: number) => {
      setTravelBusy(true);
      try {
        await uc.profile.setTravelLocation(lat, lng);
        await refreshUser();
      } catch {
        setSaveError(true);
      } finally {
        setTravelBusy(false);
      }
    },
    [uc, refreshUser]
  );

  /** خروج از حالتِ سفر — با GPSِ واقعی اگر در دسترس باشد. */
  const stopTravel = useCallback(async () => {
    setTravelBusy(true);
    try {
      const res = await resolveLocation(true);
      // بدونِ GPS هم از حالتِ سفر خارج می‌شویم؛ موقعیت با اولین fix بعدی درست می‌شود.
      const coords = res.ok ? res.coords : { lat: 35.6892, lng: 51.389 };
      await uc.profile.clearTravel(coords.lat, coords.lng);
      await refreshUser();
    } catch {
      setSaveError(true);
    } finally {
      setTravelBusy(false);
    }
  }, [uc, refreshUser]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, v] = await Promise.all([
        uc.profile.getPhotos(),
        uc.catalog.getTiers(),
        uc.likes.getViewers().catch(() => null),
      ]);
      setPhotos(p);
      setTiers(t);
      if (v) setViewersCount(v.count);
    } catch {
      /* نادیده */
    } finally {
      setLoading(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);

  const addPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      await uc.profile.addPhoto(await normalizeImage(res.assets[0].uri));
      await load();
      await refreshUser();
    } catch {
      /* نادیده */
    } finally {
      setBusy(false);
    }
  }, [uc, load, refreshUser]);

  const deletePhoto = useCallback(
    async (id: number) => {
      setBusy(true);
      try {
        await uc.profile.deletePhoto(id);
        await load();
        await refreshUser();
      } catch {
        /* نادیده */
      } finally {
        setBusy(false);
      }
    },
    [uc, load, refreshUser]
  );

  const buy = useCallback(
    async (plan: string, bazaarSku?: string) => {
      // وب/PWA: پرداخت فقط داخلِ APK ممکن است. اگر ادمین اجبار کرده باشد، به‌جای
      // زرین‌پال کاربر را به صفحه‌ی «برای خرید، اپ را نصب کن» می‌بریم.
      if (Platform.OS === 'web' && install.forceAppForPayments) {
        router.push({ pathname: '/get-app', params: { reason: 'purchase' } });
        return;
      }
      try {
        if (getPaymentMode() === 'bazaar') {
          // بیلدِ کافه‌بازار: خریدِ درون‌برنامه‌ای (Poolakey) سپس اعتبارسنجیِ سرور.
          // SKUِ بازار قابلِ تنظیم است (پنلِ ادمین)؛ اگر خالی باشد، همان code تایر.
          setBusy(true);
          await bazaarBilling.connect();
          let purchase;
          try {
            purchase = await bazaarBilling.purchase(bazaarSku || plan);
          } catch {
            // لغوِ کاربر یا نبودِ اتصالِ بازار — بی‌صدا.
            return;
          }
          try {
            await uc.catalog.verifyBazaarPurchase(purchase.originalJson, purchase.dataSignature);
            await refreshUser();
          } catch {
            // پرداخت انجام شد ولی تأییدِ سرور شکست خورد — جریان idempotent است، پس
            // «خرید»ِ دوباره همان توکن را تأیید می‌کند.
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
        setBusy(false);
      }
    },
    [uc, refreshUser, install]
  );

  return {
    user,
    photos,
    tiers,
    viewersCount,
    loading,
    busy,
    addPhoto,
    deletePhoto,
    buy,
    logout,
    draftName,
    setDraftName,
    draftBio,
    setDraftBio,
    dirty,
    saving,
    saveError,
    saveProfile,
    privacySaving,
    savingPref,
    updateMapPrivacy,
    updatePrefs,
    travelBusy,
    startTravel,
    stopTravel,
  };
}
