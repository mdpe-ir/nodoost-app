import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useCases } from '@/core/di/DIProvider';
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
 * ویومدلِ تکمیلِ پروفایل (نام، جنسیت، سن، درباره + عکسِ اجباری).
 * فیلدهای موجودِ کاربر پیش‌پر می‌شوند تا کاربرِ ناقص فقط بخشِ کم‌داشته را کامل کند.
 */
export function useOnboarding() {
  const uc = useCases();
  const { user, refreshUser } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [age, setAge] = useState(birthdateToAge(user?.birthdate));
  const [bio, setBio] = useState(user?.bio ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // عکس یا از قبل آپلود شده یا همین حالا انتخاب شده است.
  const hasPhoto = (user?.photos?.length ?? 0) > 0 || !!photoUri;

  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('برای افزودنِ عکس به گالری دسترسی بده');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    setError(null);
    setPhotoUri(res.assets[0].uri);
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
      });
      if (photoUri) await uc.profile.addPhoto(photoUri);
      await refreshUser();
      router.replace('/discover');
    } catch {
      setError('ثبت ناموفق بود. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  }, [name, gender, age, bio, photoUri, hasPhoto, uc, refreshUser]);

  return {
    name,
    setName,
    gender,
    setGender,
    age,
    setAge,
    bio,
    setBio,
    photoUri,
    pickPhoto,
    hasPhoto,
    loading,
    error,
    submit,
  };
}
