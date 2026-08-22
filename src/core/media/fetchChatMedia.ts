import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { env } from '@/core/config/env';
import type { HttpClient } from '@/core/http/HttpClient';
import { chatMediaPath } from '@/core/media/chatMediaPath';

const extOf = (kind: 'photo' | 'voice', mime?: string): string => {
  if (kind === 'photo') return '.webp';
  if (mime?.includes('m4a') || mime?.includes('mp4')) return '.m4a';
  return '.m4a';
};

/** رسانه‌ی گفتگو را با توکن می‌گیرد و برای پخش/نمایش uri محلی برمی‌گرداند. */
export async function resolveChatMediaUri(
  http: HttpClient,
  matchId: number,
  messageId: number,
  kind: 'photo' | 'voice',
  mime?: string
): Promise<string> {
  const url = env.apiBaseUrl + chatMediaPath(matchId, messageId);
  const headers = await http.authHeaders();

  if (Platform.OS === 'web') {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('media_fetch_failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  const ext = extOf(kind, mime);
  const dest = new File(Paths.cache, `chat-${messageId}${ext}`);
  if (dest.exists) return dest.uri;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('media_fetch_failed');
  const buf = new Uint8Array(await res.arrayBuffer());
  dest.write(buf);
  return dest.uri;
}
