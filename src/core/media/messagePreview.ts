import type { Message, MessageReply } from '@/domain/entities/chat';

/** متنِ نمایشی برای پیش‌نمایش/نقل — جایگزینِ body برای صدا و عکس. */
export function messagePreviewText(
  msg: Pick<Message | MessageReply, 'body'> & {
    kind?: Message['kind'];
    deleted?: boolean;
  }
): string {
  if (msg.deleted) return 'پیامِ حذف‌شده';
  if (msg.kind === 'voice') return 'پیام صوتی';
  if (msg.kind === 'photo') return 'عکس';
  return msg.body;
}
