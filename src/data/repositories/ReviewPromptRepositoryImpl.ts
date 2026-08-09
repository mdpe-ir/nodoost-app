import type {
  ReviewPromptAction,
  ReviewPromptRepository,
  ReviewPromptState,
} from '@/domain/repositories/ReviewPromptRepository';
import type { HttpClient } from '@/core/http/HttpClient';

interface ReviewPromptDTO {
  eligible?: boolean;
  status?: string;
  asks?: number;
}

const STATUSES: ReviewPromptState['status'][] = [
  'pending',
  'later',
  'never',
  'rated',
  'unhappy',
];

export class ReviewPromptRepositoryImpl implements ReviewPromptRepository {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<ReviewPromptState> {
    const d = await this.http.request<ReviewPromptDTO>('/api/me/review-prompt');
    const status = STATUSES.find((s) => s === d?.status) ?? 'pending';
    return { eligible: Boolean(d?.eligible), status, asks: d?.asks ?? 0 };
  }

  async report(action: ReviewPromptAction, note?: string): Promise<void> {
    await this.http.request('/api/me/review-prompt', {
      method: 'POST',
      body: { action, note },
    });
  }
}
