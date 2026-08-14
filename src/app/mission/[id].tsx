import { useLocalSearchParams } from 'expo-router';
import { MissionDetailScreen } from '@/presentation/screens/MissionDetailScreen';

export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MissionDetailScreen missionId={Number(id)} />;
}
