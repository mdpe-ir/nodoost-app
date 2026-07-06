import { useLocalSearchParams } from 'expo-router';
import { ThreadScreen } from '@/presentation/screens/ThreadScreen';

export default function Thread() {
  const { id, name, peerId } = useLocalSearchParams<{ id: string; name?: string; peerId?: string }>();
  return <ThreadScreen matchId={Number(id)} name={name} peerId={peerId ? Number(peerId) : undefined} />;
}
