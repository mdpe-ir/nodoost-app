import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useCases } from '@/core/di/DIProvider';
import type { Gender } from '@/domain/entities';

/** سن را به تاریخِ تولدِ تقریبی (میلادی) تبدیل می‌کند — کاوش به birthdate نیاز دارد. */
function ageToBirthdate(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-06-15`;
}

/** ویومدلِ تکمیلِ پروفایل (نام، جنسیت، سن، درباره). */
export function useOnboarding() {
  const uc = useCases();
  const { refreshUser } = useSession();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setLoading(true);
    try {
      await uc.profile.updateProfile({
        name: name.trim(),
        gender,
        bio: bio.trim(),
        birthdate: ageToBirthdate(ageNum),
      });
      await refreshUser();
      router.replace('/discover');
    } catch {
      setError('ثبت ناموفق بود. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  }, [name, gender, age, bio, uc, refreshUser]);

  return { name, setName, gender, setGender, age, setAge, bio, setBio, loading, error, submit };
}
