import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { getPaymentMode } from '@/core/billing/paymentStrategy';
import { bazaarBilling } from '@/core/billing/bazaarBilling';
import type { Photo, Tier } from '@/domain/entities';

/** ویومدلِ پروفایل: عکس‌ها، تایرها، ویرایشِ نام/بیو، آپلود/حذفِ عکس، خرید، خروج. */
export function useProfileViewModel() {
  const uc = useCases();
  const { user, refreshUser, logout } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // — ویرایشِ نام و بیو —
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

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

  const updateMapPrivacy = useCallback(async (showExactLocationOnMap: boolean) => {
    setPrivacySaving(true);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({
        prefs: {
          showOnMap: user?.prefs?.showOnMap ?? true,
          showExactLocationOnMap,
        },
      });
      await refreshUser();
    } catch {
      setSaveError(true);
    } finally {
      setPrivacySaving(false);
    }
  }, [uc, user, refreshUser]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([uc.profile.getPhotos(), uc.catalog.getTiers()]);
      setPhotos(p);
      setTiers(t);
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
      await uc.profile.addPhoto(res.assets[0].uri);
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
    async (plan: string) => {
      try {
        if (getPaymentMode() === 'bazaar') {
          // بیلدِ کافه‌بازار: خریدِ درون‌برنامه‌ای (Poolakey) سپس اعتبارسنجیِ سرور.
          // `plan` همان code تایر و همان SKUِ ثبت‌شده در کنسولِ بازار است.
          setBusy(true);
          await bazaarBilling.connect();
          const purchase = await bazaarBilling.purchase(plan);
          await uc.catalog.verifyBazaarPurchase(purchase.productId, purchase.purchaseToken);
          await refreshUser();
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
    [uc, refreshUser]
  );

  return {
    user,
    photos,
    tiers,
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
    updateMapPrivacy,
  };
}
