import { useLocalSearchParams } from 'expo-router';
import { ChatInfoScreen } from '@/presentation/screens/ChatInfoScreen';

/**
 * اطلاعاتِ مخاطبِ یک گفتگو — مقصدِ تپ روی هدرِ تِرِد (فلوی تلگرام).
 * پارامترهای اختیاریِ طرفِ مقابل از همان جا می‌آیند تا صفحه پیش از رسیدنِ
 * پاسخِ پروفایل، هویتِ درست را نشان دهد.
 */
export default function ChatInfoRoute() {
  const { id, peerId, name, photoUrl, peerTier } = useLocalSearchParams<{
    id: string;
    peerId?: string;
    name?: string;
    photoUrl?: string;
    peerTier?: string;
  }>();
  return (
    <ChatInfoScreen
      matchId={Number(id)}
      peerId={peerId ? Number(peerId) : undefined}
      name={name}
      photoUrl={photoUrl}
      peerTier={peerTier ? Number(peerTier) : undefined}
    />
  );
}
