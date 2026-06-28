import { useLocalSearchParams } from 'expo-router';
import { ThreadScreen } from '@/presentation/screens/ThreadScreen';

export default function Thread() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return <ThreadScreen matchId={Number(id)} name={name} />;
}
