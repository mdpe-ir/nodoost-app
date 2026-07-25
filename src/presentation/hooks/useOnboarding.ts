import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useCases } from '@/core/di/DIProvider';
import { photoErrorMessage } from '@/core/media/photoErrors';
import type { Gender } from '@/domain/entities';

/** سن را به تاریخِ تولدِ تقریبی (میلادی) تبدیل می‌کند — کاوش به birthdate نیاز دارد. */
function ageToBirthdate(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-06-15`;
}

/** از تاریخِ تولدِ ذخیره‌شده سنِ تقریبی را درمی‌آورد (برای پیش‌پرکردنِ فرم). */
function birthdateToAge(bd?: string): string {
  if (!bd) return '';
  const y = Number(bd.slice(0, 4));
  if (!Number.isFinite(y)) return '';
  const a = new Date().getFullYear() - y;
  return a >= 18 && a <= 99 ? String(a) : '';
}

/**
 * ویومدلِ تکمیلِ پروفایل (نام، جنسیت، سن، درباره، علاقه‌مندی‌ها + عکسِ اجباری).
 * فیلدهای موجودِ کاربر پیش‌پر می‌شوند تا کاربرِ ناقص فقط بخشِ کم‌داشته را کامل کند.
 */
export function useOnboarding() {
  const uc = useCases();
  const { user, refreshUser } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [age, setAge] = useState(birthdateToAge(user?.birthdate));
  const [bio, setBio] = useState(user?.bio ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // عکس یا از قبل آپلود شده یا همین حالا انتخاب شده است.
  const hasPhoto = user?.photos?.some((photo) => photo.status === 'approved') === true || !!photoUri;
  const rejectionReasons = user?.photos
    ?.filter((photo) => photo.status === 'rejected' && photo.rejectionReason)
    .map((photo) => photo.rejectionReason as string) ?? [];

  /** برگه‌ی انتخابِ سرچشمه (دوربین/گالری) را باز می‌کند؛ بقیه‌ی کار با PhotoPicker است. */
  const pickPhoto = useCallback(() => {
    setError(null);
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  /** خروجیِ ویرایشگر از قبل JPEGِ برش‌خورده و فشرده است — همان را نگه می‌داریم. */
  const onPhotoPicked = useCallback((uri: string) => {
    setError(null);
    setPhotoUri(uri);
  }, []);

  const submit = useCallback(async () => {
    if (!name.trim()) {
      setError('اسمت را وارد کن');
      return;
    }
    if (!gender) {
      setError('جنسیت را انتخاب کن');
      return;
    }
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99) {
      setError('سنت را درست وارد کن (۱۸ تا ۹۹)');
      return;
    }
    if (!hasPhoto) {
      setError('برای استفاده از اپ حداقل یک عکس لازم است');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await uc.profile.updateProfile({
        name: name.trim(),
        gender,
        bio: bio.trim(),
        birthdate: ageToBirthdate(ageNum),
        interests,
      });
      if (photoUri) await uc.profile.addPhoto(photoUri);
    } catch (e) {
      // تنها این دو فراخوانی «ثبت» هستند؛ خطای این‌جا واقعاً یعنی ذخیره نشد.
      setError(photoErrorMessage(e));
      setLoading(false);
      return;
    }

    // از این نقطه به بعد پروفایل و عکس ذخیره شده‌اند. تازه‌سازیِ نشست یک کارِ
    // جانبی است؛ اگر شکست بخورد نباید «ثبت ناموفق بود» نشان دهیم — گارد مسیر
    // با اولین رفرشِ بعدی خودش را درست می‌کند.
    try {
      await refreshUser();
    } catch {
      /* نادیده — داده روی سرور ذخیره شده است */
    }
    setLoading(false);
    router.replace('/discover');
  }, [name, gender, age, bio, interests, photoUri, hasPhoto, uc, refreshUser]);

  return {
    name,
    setName,
    gender,
    setGender,
    age,
    setAge,
    bio,
    setBio,
    interests,
    setInterests,
    photoUri,
    pickPhoto,
    pickerOpen,
    closePicker,
    onPhotoPicked,
    setError,
    hasPhoto,
    rejectionReasons,
    loading,
    error,
    submit,
  };
}
