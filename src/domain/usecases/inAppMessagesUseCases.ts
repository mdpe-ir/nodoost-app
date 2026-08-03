import type { InAppMessagesRepository } from '@/domain/repositories/InAppMessagesRepository';
import type { InAppEvent } from '@/domain/entities';

export const makeGetInAppMessages = (r: InAppMessagesRepository) => () => r.list();

/**
 * ثبتِ رویداد عمداً «فراموشش کن» است: اگر شبکه قطع باشد، نباید بستنِ یک بنر
 * خطا نشان دهد. بدترین پیامدِ گم‌شدنِ یک رویداد این است که پیام یک بارِ دیگر
 * نشان داده شود — که از خطا دادن به کاربر خیلی بهتر است.
 */
export const makeRecordInAppEvent =
  (r: InAppMessagesRepository) =>
  (messageId: number, action: InAppEvent): void => {
    void r.recordEvent(messageId, action).catch(() => {});
  };

export type InAppMessagesUseCases = {
  list: ReturnType<typeof makeGetInAppMessages>;
  recordEvent: ReturnType<typeof makeRecordInAppEvent>;
};
