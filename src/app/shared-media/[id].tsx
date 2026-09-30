import { useLocalSearchParams } from 'expo-router';
import { SharedMediaScreen } from '@/presentation/screens/SharedMediaScreen';

/** مدیای اشتراکیِ یک گفتگو — مقصدِ ردیفِ «مدیای اشتراکی» در اطلاعاتِ مخاطب. */
export default function SharedMediaRoute() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return <SharedMediaScreen matchId={Number(id)} name={name} />;
}
