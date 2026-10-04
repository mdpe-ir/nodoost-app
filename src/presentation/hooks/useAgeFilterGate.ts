import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { ageFilterOpen } from '@/core/config/ageFilter';

/** ارزیابیِ دروازه‌ی فیلترِ سن برای کاربرِ جاری. */
export function useAgeFilterGate() {
  const { ageFilter } = useRemoteConfig();
  const { user } = useSession();
  const myTier = user?.tier ?? 1;
  return {
    open: ageFilterOpen(ageFilter, myTier),
    requiredTier: ageFilter.minTier ?? 2,
    myTier,
  };
}
