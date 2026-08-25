import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { env } from '@/core/config/env';
import type { HttpClient, TransferProgressHandler } from '@/core/http/HttpClient';
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
  mime?: string,
  onProgress?: TransferProgressHandler
): Promise<string> {
  const url = env.apiBaseUrl + chatMediaPath(matchId, messageId);
  const headers = await http.authHeaders();

  if (Platform.OS === 'web') {
    return downloadWeb(url, headers, onProgress);
  }

  const ext = extOf(kind, mime);
  const dest = new File(Paths.cache, `chat-${messageId}${ext}`);
  if (dest.exists) {
    onProgress?.(1);
    return dest.uri;
  }

  // File.downloadFileAsync با onProgress روی نیتیو — جایگزینِ fetch خام.
  await File.downloadFileAsync(url, dest, {
    headers,
    idempotent: true,
    onProgress: onProgress
      ? ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) onProgress(Math.min(1, bytesWritten / totalBytes));
          else onProgress(0);
        }
      : undefined,
  });
  onProgress?.(1);
  return dest.uri;
}

function downloadWeb(
  url: string,
  headers: Record<string, string>,
  onProgress?: TransferProgressHandler
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    if (onProgress) {
      xhr.onprogress = (ev) => {
        if (ev.lengthComputable && ev.total > 0) {
          onProgress(Math.min(1, ev.loaded / ev.total));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('media_fetch_failed'));
        return;
      }
      onProgress?.(1);
      resolve(URL.createObjectURL(xhr.response as Blob));
    };
    xhr.onerror = () => reject(new Error('media_fetch_failed'));
    xhr.send();
  });
}
