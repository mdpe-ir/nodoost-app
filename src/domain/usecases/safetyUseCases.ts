import type { SafetyRepository } from '@/domain/repositories/SafetyRepository';

export const makeBlockUser = (r: SafetyRepository) => (id: number) => r.block(id);
export const makeUnblockUser = (r: SafetyRepository) => (id: number) => r.unblock(id);
export const makeGetBlocks = (r: SafetyRepository) => (page?: number) => r.listBlocks(page);
export const makeReportUser =
  (r: SafetyRepository) =>
  (id: number, reason: string, photoId?: number, messageId?: number) =>
    r.report(id, reason, photoId, messageId);

export type SafetyUseCases = {
  block: ReturnType<typeof makeBlockUser>;
  unblock: ReturnType<typeof makeUnblockUser>;
  getBlocks: ReturnType<typeof makeGetBlocks>;
  report: ReturnType<typeof makeReportUser>;
};
