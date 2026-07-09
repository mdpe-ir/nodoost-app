import { useLocalSearchParams } from 'expo-router';
import { ThreadScreen } from '@/presentation/screens/ThreadScreen';

export default function Thread() {
  const { id, name, peerId, photoUrl, peerTier } = useLocalSearchParams<{
    id: string;
    name?: string;
    peerId?: string;
    photoUrl?: string;
    peerTier?: string;
  }>();
  return (
    <ThreadScreen
      matchId={Number(id)}
      name={name}
      peerId={peerId ? Number(peerId) : undefined}
      photoUrl={photoUrl}
      peerTier={peerTier ? Number(peerTier) : undefined}
    />
  );
}
