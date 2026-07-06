import type { SafetyRepository } from '@/domain/repositories/SafetyRepository';
import type { HttpClient } from '@/core/http/HttpClient';

export class SafetyRepositoryImpl implements SafetyRepository {
  constructor(private readonly http: HttpClient) {}

  async block(targetId: number): Promise<void> {
    await this.http.request('/api/safety/block', { method: 'POST', body: { target_id: targetId } });
  }

  async report(targetId: number, reason: string, photoId?: number): Promise<void> {
    await this.http.request('/api/safety/report', {
      method: 'POST',
      body: { target_id: targetId, reason, photo_id: photoId },
    });
  }
}
