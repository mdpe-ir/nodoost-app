import { useCallback, useEffect, useRef, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { photoErrorMessage } from '@/core/media/photoErrors';
import { resolveLocation } from '@/core/utils/location';
import { useRefetchOnFocus } from '@/presentation/hooks/useRefetchOnFocus';
import type { Photo, UserPreferences } from '@/domain/entities';

/**
 * ویومدلِ پروفایل: عکس‌ها، ویرایشِ نام/بیو، آپلود/حذفِ عکس، حریمِ خصوصی، خروج.
 * تایرها و خرید این‌جا نیست — تنها سطحِ خرید usePlansViewModel/صفحه‌ی /plans است.
 *
 * `skipMedia` برای صفحاتی است که فقط به کاربر و تنظیماتش کار دارند (تنظیمات،
 * ویرایشِ پروفایل): بدونِ آن، هر بار بازکردنِ آن صفحات سه درخواستِ بی‌مصرفِ
 * عکس/بازدید/دنبال‌کننده می‌فرستاد.
 */
export function useProfileViewModel({ skipMedia = false }: { skipMedia?: boolean } = {}) {
  const uc = useCases();
  const { user, refreshUser, logout } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  // شمارنده‌های دنبال‌کردن برای ردیفِ آمارِ بالای پروفایل (سبکِ اینستاگرام).
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(!skipMedia);
  const [busy, setBusy] = useState(false);
  const [travelBusy, setTravelBusy] = useState(false);
  // — افزودنِ عکس: برگه‌ی سرچشمه + پیامِ خطای اختصاصی —
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // عکسی که همین حالا دارد «اصلی» می‌شود — برای لودرِ همان کاشی.
  const [primaryBusyId, setPrimaryBusyId] = useState<number | null>(null);
  /** عکسِ تازه، وقتی از مسیرِ «عوض‌کردنِ عکسِ پروفایل» آمده باشد، باید اصلی شود. */
  const makePrimaryOnUpload = useRef(false);

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

  /*
   * نام/بیو و علاقه‌مندی‌ها دو صفحه‌ی جدا شده‌اند، پس دو پیش‌نویسِ مستقل‌اند و
   * هرکدام فقط فیلدِ خودش را می‌فرستد. اگر یکی‌شان کلِ سه فیلد را می‌فرستاد،
   * ذخیره‌ی علاقه‌مندی‌ها نامِ ویرایش‌نشده‌ی صفحه‌ی دیگر را هم پس می‌فرستاد و
   * تغییرِ ذخیره‌نشده‌ی آن صفحه بی‌صدا از بین می‌رفت.
   */
  const dirty =
    draftName.trim() !== (user?.name ?? '') || draftBio.trim() !== (user?.bio ?? '');

  const interestsDirty =
    [...draftInterests].sort().join('|') !== [...(user?.interests ?? [])].sort().join('|');

  /** true یعنی ذخیره شد — صفحه‌ی ویرایش با همین مقدار تصمیم می‌گیرد که برگردد یا نه. */
  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (draftName.trim().length < 2) return false;
    setSaving(true);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({ name: draftName.trim(), bio: draftBio.trim() });
      await refreshUser();
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftName, draftBio, uc, refreshUser]);

  /** ذخیره‌ی صفحه‌ی علاقه‌مندی‌ها — فقط همین یک فیلد. */
  const saveInterests = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(false);
    try {
      await uc.profile.updateProfile({ interests: draftInterests });
      await refreshUser();
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftInterests, uc, refreshUser]);

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

  /**
   * `silent` یعنی بدونِ اسکلتِ تمام‌صفحه — برای تازه‌سازی‌هایی که کاربر خودش
   * درخواستشان نکرده (بازگشت از صفحه‌ی عکس‌ها، حذف/افزودنِ عکس). بدونِ آن، هر
   * بار برگشتن به صفحه‌ی «من» کلِ محتوا یک لحظه با اسکلت جایگزین می‌شد.
   */
  const load = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (skipMedia) return;
    if (!silent) setLoading(true);
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
  }, [uc, skipMedia]);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * عکس‌ها حالا در صفحه‌ی جداگانه‌ی ‎/photos‎ مدیریت می‌شوند؛ بدونِ این، بازگشت
   * به صفحه‌ی «من» هنوز شبکه‌ی قبلی را نشان می‌داد و عکسِ تازه‌آپلودشده در
   * نوارِ پیش‌نمایش نبود.
   */
  const reload = useCallback(() => {
    void load({ silent: true });
  }, [load]);
  useRefetchOnFocus(reload);

  /**
   * برگه‌ی انتخابِ سرچشمه (دوربین/گالری) را باز می‌کند؛ بقیه‌ی کار با PhotoPicker است.
   * با `makePrimary` عکسِ تازه بلافاصله عکسِ پیش‌فرضِ پروفایل می‌شود.
   */
  const addPhoto = useCallback((options?: { makePrimary?: boolean }) => {
    makePrimaryOnUpload.current = options?.makePrimary === true;
    setPhotoError(null);
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  /**
   * uriِ ورودی از قبل JPEGِ برش‌خورده و فشرده است. خطای آپلود دیگر بلعیده
   * نمی‌شود — کاربر باید بفهمد چرا عکسش بالا نرفت.
   */
  const onPhotoPicked = useCallback(
    async (uri: string) => {
      setBusy(true);
      setPhotoError(null);
      try {
        const created = await uc.profile.addPhoto(uri);
        // «عوض‌کردنِ عکسِ پروفایل» با یک عکسِ تازه: بلافاصله همان را اصلی کن.
        if (makePrimaryOnUpload.current && created && !created.isPrimary) {
          await uc.profile.setPrimaryPhoto(created.id);
        }
      } catch (e) {
        setPhotoError(photoErrorMessage(e));
      } finally {
        makePrimaryOnUpload.current = false;
        // حتی اگر مرحله‌ی «اصلی‌کردن» شکست بخورد، عکس آپلود شده و باید دیده شود.
        await load({ silent: true });
        await refreshUser().catch(() => {});
        setBusy(false);
      }
    },
    [uc, load, refreshUser]
  );

  /**
   * عوض‌کردنِ عکسِ پیش‌فرضِ پروفایل. خوش‌بینانه عمل می‌کند تا چهره‌ی بالای صفحه
   * بی‌درنگ عوض شود؛ با شکست، حالتِ قبلی برمی‌گردد و دلیل نشان داده می‌شود.
   */
  const setPrimaryPhoto = useCallback(
    async (id: number): Promise<boolean> => {
      const previous = photos;
      if (previous.find((p) => p.id === id)?.isPrimary) return true;
      setPrimaryBusyId(id);
      setPhotoError(null);
      setPhotos((list) => list.map((p) => ({ ...p, isPrimary: p.id === id })));
      try {
        await uc.profile.setPrimaryPhoto(id);
        // نشست هم نسخه‌ی خودش از عکس‌ها را دارد (هدرِ چت، کارتِ کاوش…).
        await refreshUser().catch(() => {});
        return true;
      } catch (e) {
        setPhotos(previous);
        setPhotoError(photoErrorMessage(e));
        return false;
      } finally {
        setPrimaryBusyId(null);
      }
    },
    [photos, uc, refreshUser]
  );

  const deletePhoto = useCallback(
    async (id: number) => {
      setBusy(true);
      setPhotoError(null);
      try {
        await uc.profile.deletePhoto(id);
        await load({ silent: true });
        await refreshUser();
      } catch (e) {
        setPhotoError(photoErrorMessage(e));
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
    reload,
    addPhoto,
    pickerOpen,
    closePicker,
    onPhotoPicked,
    photoError,
    setPhotoError,
    deletePhoto,
    setPrimaryPhoto,
    primaryBusyId,
    logout,
    draftName,
    setDraftName,
    draftBio,
    setDraftBio,
    draftInterests,
    setDraftInterests,
    dirty,
    interestsDirty,
    saving,
    saveError,
    saveProfile,
    saveInterests,
    privacySaving,
    savingPref,
    updateMapPrivacy,
    updatePrefs,
    travelBusy,
    startTravel,
    stopTravel,
  };
}
