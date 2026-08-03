import type { InAppEvent, InAppMessage } from '@/domain/entities';

export interface InAppMessagesRepository {
  /** پیام‌های واجدِ شرایطِ همین لحظه — فیلترِ سگمنت و زمان سمتِ سرور اعمال شده است. */
  list(): Promise<InAppMessage[]>;
  /** ثبتِ برخوردِ کاربر با پیام. شکستش نباید چیزی را متوقف کند. */
  recordEvent(messageId: number, action: InAppEvent): Promise<void>;
}
