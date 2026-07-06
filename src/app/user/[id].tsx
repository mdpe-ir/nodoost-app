import { useLocalSearchParams } from 'expo-router';
import { PeerProfileScreen } from '@/presentation/screens/PeerProfileScreen';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PeerProfileScreen userId={Number(id)} />;
}
