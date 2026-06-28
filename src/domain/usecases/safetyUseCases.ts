import type { SafetyRepository } from '@/domain/repositories/SafetyRepository';

export const makeBlockUser = (r: SafetyRepository) => (id: number) => r.block(id);
export const makeReportUser =
  (r: SafetyRepository) => (id: number, reason: string) =>
    r.report(id, reason);

export type SafetyUseCases = {
  block: ReturnType<typeof makeBlockUser>;
  report: ReturnType<typeof makeReportUser>;
};
