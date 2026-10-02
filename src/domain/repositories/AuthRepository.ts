import type { AuthResult } from '@/domain/entities';

export interface AuthRepository {
  requestOtp(phone: string): Promise<{ debugCode?: string }>;
  verifyOtp(phone: string, code: string): Promise<AuthResult>;
  logout(accountId: string): Promise<void>;
}
