import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import type { AuthResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { AuthDTO, AuthSessionDTO } from '@/data/dto';
import { toAuthResult, toAuthSession } from '@/data/mappers';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  async requestOtp(phone: string): Promise<{ debugCode?: string }> {
    const d = await this.http.request<{ debug_code?: string }>('/api/auth/request-otp', {
      method: 'POST',
      auth: false,
      body: { phone },
    });
    return { debugCode: d?.debug_code };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    const dto = await this.http.request<AuthDTO>('/api/auth/verify-otp', {
      method: 'POST',
      auth: false,
      body: { phone, code },
    });
    return toAuthResult(dto);
  }

  logout(accountId: string): Promise<void> {
    return this.http.logoutSession(accountId);
  }

  async listSessions() {
    const response = await this.http.request<{ sessions: AuthSessionDTO[] | null }>(
      '/api/me/sessions'
    );
    return (response.sessions ?? []).map(toAuthSession);
  }

  async revokeSession(sid: string): Promise<void> {
    await this.http.request(`/api/me/sessions/${encodeURIComponent(sid)}`, {
      method: 'DELETE',
    });
  }
}
