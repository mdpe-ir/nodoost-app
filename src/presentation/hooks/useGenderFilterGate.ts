import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { genderFilterOpen } from '@/core/config/genderFilter';

/** ارزیابیِ دروازه‌ی فیلترِ جنسیت برای کاربرِ جاری. */
export function useGenderFilterGate() {
  const { genderFilter } = useRemoteConfig();
  const { user } = useSession();
  const myTier = user?.tier ?? 1;
  return {
    open: genderFilterOpen(genderFilter, myTier),
    requiredTier: genderFilter.minTier ?? 2,
    myTier,
  };
}
