import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import type { AuthResult } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { AuthDTO } from '@/data/dto';
import { toAuthResult } from '@/data/mappers';

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
}
