import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useCases } from '@/core/di/DIProvider';
import type { Gender } from '@/domain/entities';

/** ویومدلِ تکمیلِ پروفایل (نام، جنسیت، درباره). */
export function useOnboarding() {
  const uc = useCases();
  const { refreshUser } = useSession();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
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
    setError(null);
    setLoading(true);
    try {
      await uc.profile.updateProfile({ name: name.trim(), gender, bio: bio.trim() });
      await refreshUser();
      router.replace('/discover');
    } catch {
      setError('ثبت ناموفق بود. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  }, [name, gender, bio, uc, refreshUser]);

  return { name, setName, gender, setGender, bio, setBio, loading, error, submit };
}
