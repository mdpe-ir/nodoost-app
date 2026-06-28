import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import type { SessionStore } from '@/domain/repositories/SessionStore';
import type { AuthResult } from '@/domain/entities';

export const makeRequestOtp = (repo: AuthRepository) => (phone: string) =>
  repo.requestOtp(phone);

/** تأییدِ کد + ذخیره‌ی توکن‌ها (منطقِ نشست اینجاست). */
export const makeVerifyOtp =
  (repo: AuthRepository, session: SessionStore) =>
  async (phone: string, code: string): Promise<AuthResult> => {
    const result = await repo.verifyOtp(phone, code);
    await session.save(result.accessToken, result.refreshToken);
    return result;
  };

export const makeLogout = (session: SessionStore) => () => session.clear();

export const makeHasSession = (session: SessionStore) => async () =>
  Boolean(await session.getAccess());

export type AuthUseCases = {
  requestOtp: ReturnType<typeof makeRequestOtp>;
  verifyOtp: ReturnType<typeof makeVerifyOtp>;
  logout: ReturnType<typeof makeLogout>;
  hasSession: ReturnType<typeof makeHasSession>;
};
