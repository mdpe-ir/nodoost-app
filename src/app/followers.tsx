import { useLocalSearchParams } from 'expo-router';
import { FollowersScreen } from '@/presentation/screens/FollowersScreen';
import type { FollowListKind } from '@/domain/entities';

/**
 * فهرستِ دنبال‌کننده‌ها/دنبال‌شده‌ها.
 * `?user=<id>` تهی باشد یعنی فهرستِ خودم؛ `?tab=following` روی زبانه‌ی دوم باز می‌شود.
 */
export default function FollowersRoute() {
  const { user, tab, name } = useLocalSearchParams<{ user?: string; tab?: string; name?: string }>();
  const userId = user ? Number(user) : undefined;
  const initialTab: FollowListKind = tab === 'following' ? 'following' : 'followers';
  return (
    <FollowersScreen
      userId={Number.isFinite(userId) ? userId : undefined}
      initialTab={initialTab}
      peerName={name || undefined}
    />
  );
}
