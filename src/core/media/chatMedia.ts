import { env } from '@/core/config/env';
import { TokenStorage } from '@/core/storage/TokenStorage';

const tokens = new TokenStorage();

/** مسیرِ رسانه‌ی یک پیام — GET با Bearer. */
export const chatMediaPath = (matchId: number, messageId: number) =>
  `/api/matches/${matchId}/messages/${messageId}/media`;

export const chatMediaUrl = (matchId: number, messageId: number) =>
  env.apiBaseUrl + chatMediaPath(matchId, messageId);

/** هدرِ احراز برای Image / expo-audio. */
export const authMediaHeaders = async (): Promise<Record<string, string>> => {
  const token = await tokens.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
