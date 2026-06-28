import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import type { Photo, Tier } from '@/domain/entities';

/** ویومدلِ پروفایل: عکس‌ها، تایرها، آپلود/حذفِ عکس، خرید، خروج. */
export function useProfileViewModel() {
  const uc = useCases();
  const { user, refreshUser, logout } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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
        const { payUrl } = await uc.catalog.startPayment(plan);
        if (payUrl) await WebBrowser.openBrowserAsync(payUrl);
      } catch {
        /* نادیده */
      }
    },
    [uc]
  );

  return { user, photos, tiers, loading, busy, addPhoto, deletePhoto, buy, logout };
}
