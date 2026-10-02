import type { SupportRepository } from '@/domain/repositories/SupportRepository';
import type { MessagePageOptions } from '@/domain/repositories/ChatRepository';

export const makeGetSupportOverview = (r: SupportRepository) => () => r.getOverview();
export const makeStartSupportThread =
  (r: SupportRepository) => (topic: string) => r.startThread(topic);
export const makeGetSupportMessages =
  (r: SupportRepository) => (opts?: MessagePageOptions) => r.getMessages(opts);
export const makeSendSupportMessage =
  (r: SupportRepository) => (body: string, topic?: string) => r.sendMessage(body, topic);
export const makeSendSupportPhoto =
  (r: SupportRepository) => (uri: string, topic?: string, onProgress?: (ratio: number) => void) =>
    r.sendPhoto(uri, topic, onProgress);

export type SupportUseCases = {
  getOverview: ReturnType<typeof makeGetSupportOverview>;
  startThread: ReturnType<typeof makeStartSupportThread>;
  getMessages: ReturnType<typeof makeGetSupportMessages>;
  sendMessage: ReturnType<typeof makeSendSupportMessage>;
  sendPhoto: ReturnType<typeof makeSendSupportPhoto>;
};
