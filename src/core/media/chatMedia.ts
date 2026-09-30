import { env } from '@/core/config/env';
import { accountStorage } from '@/core/storage/AccountStorage';

/**
 * نمونه‌ی مشترک با کانتینرِ DI — عمداً `new` نمی‌کنیم: هر نمونه ایندکسِ
 * درون‌حافظه‌ی خودش را دارد و دو نسخه با هم اختلاف پیدا می‌کنند.
 */
const tokens = accountStorage;

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
