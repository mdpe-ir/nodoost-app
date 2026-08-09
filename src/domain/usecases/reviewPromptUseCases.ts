import type {
  ReviewPromptAction,
  ReviewPromptRepository,
} from '@/domain/repositories/ReviewPromptRepository';

export const makeGetReviewPrompt = (r: ReviewPromptRepository) => () => r.get();

export const makeReportReviewPrompt =
  (r: ReviewPromptRepository) => (action: ReviewPromptAction, note?: string) =>
    r.report(action, note);

export type ReviewPromptUseCases = {
  get: ReturnType<typeof makeGetReviewPrompt>;
  report: ReturnType<typeof makeReportReviewPrompt>;
};
