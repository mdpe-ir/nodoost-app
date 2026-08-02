import type { Message, SupportOverview } from '@/domain/entities';
import type { MessagePageOptions } from '@/domain/repositories/ChatRepository';

/**
 * پشتیبانی مسیرِ HTTPِ خودش را دارد (نه /matches) چون سمتِ سرور بیرونِ دروازه‌ی
 * «پروفایلِ کامل» ثبت شده است: کاربرِ مسدود یا نیمه‌ثبت‌نام هم باید بتواند
 * تماس بگیرد. پیام‌ها اما همان موجودیتِ Message هستند، پس صفحه‌ی گفتگو مشترک است.
 */
export interface SupportRepository {
  getOverview(): Promise<SupportOverview>;
  /** گفتگو را با موضوعِ انتخابی باز (یا پیدا) می‌کند و matchId می‌دهد. */
  startThread(topic: string): Promise<number>;
  getMessages(opts?: MessagePageOptions): Promise<Message[]>;
  sendMessage(body: string, topic?: string): Promise<Message>;
}
