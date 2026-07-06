import type { SafetyRepository } from '@/domain/repositories/SafetyRepository';

export const makeBlockUser = (r: SafetyRepository) => (id: number) => r.block(id);
export const makeReportUser =
  (r: SafetyRepository) => (id: number, reason: string, photoId?: number) =>
    r.report(id, reason, photoId);

export type SafetyUseCases = {
  block: ReturnType<typeof makeBlockUser>;
  report: ReturnType<typeof makeReportUser>;
};
