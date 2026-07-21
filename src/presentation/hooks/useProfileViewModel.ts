import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { normalizeImage } from '@/core/media/normalizeImage';
import { resolveLocation } from '@/core/utils/location';
import type { Photo, UserPreferences } from '@/domain/entities';

/**
 * ویومدلِ پروفایل: عکس‌ها، ویرایشِ نام/بیو، آپلود/حذفِ عکس، حریمِ خصوصی، خروج.
 * تایرها و خرید این‌جا نیست — تنها سطحِ خرید usePlansViewModel/صفحه‌ی /plans است.
 */
export function useProfileViewModel() {
  const uc = useCases();
  const { user, refreshUser, logout } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  // شمارنده‌های دنبال‌کردن برای ردیفِ آمارِ بالای پروفایل (سبکِ اینستاگرام).
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [travelBusy, setTravelBusy] = useState(false);

  // — ویرایشِ نام، بیو و علاقه‌مندی‌ها —
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  // کلیدِ تنظیمی که همین حالا در حالِ ذخیره است — تا فقط رویِ همان ردیف لودر نشان دهیم.
  const [savingPref, setSavingPref] = useState<string | null>(null);

  useEffect(() => {
    setDraftName(user?.name ?? '');
    setDraftBio(user?.bio ?? '');
    setDraftInterests(user?.interests ?? []);
    // فقط وقتی هویتِ کاربر عوض می‌شود مقداردهی کن، نه وسطِ تایپ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dirty =
    draftName.trim() !== (user?.name ?? '') ||
    draftBio.trim() !== (user?.bio ?? '') ||
    [...draftInterests].sort().join('|') !== [...(user?.interests ?? [])].sort().join('|');

  const saveProfile = useCallback(async () => {
    if (draftName.trim().length < 2) return;
    setSaving(true);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({
        name: draftName.trim(),
        bio: draftBio.trim(),
        interests: draftInterests,
      });
      await refreshUser();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftName, draftBio, draftInterests, uc, refreshUser]);

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
      const [p, v, fr, fg] = await Promise.all([
        uc.profile.getPhotos(),
        uc.likes.getViewers().catch(() => null),
        uc.follow.getList('followers').catch(() => null),
        uc.follow.getList('following').catch(() => null),
      ]);
      setPhotos(p);
      if (v) setViewersCount(v.count);
      if (fr) setFollowersCount(fr.total ?? fr.items.length);
      if (fg) setFollowingCount(fg.total ?? fg.items.length);
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

  return {
    user,
    photos,
    viewersCount,
    followersCount,
    followingCount,
    loading,
    busy,
    addPhoto,
    deletePhoto,
    logout,
    draftName,
    setDraftName,
    draftBio,
    setDraftBio,
    draftInterests,
    setDraftInterests,
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
