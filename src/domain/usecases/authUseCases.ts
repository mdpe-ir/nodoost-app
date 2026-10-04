import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import type { SessionStore } from '@/domain/repositories/SessionStore';
import type { AccountMeta, AuthResult } from '@/domain/entities';

export const makeRequestOtp = (repo: AuthRepository) => (phone: string) =>
  repo.requestOtp(phone);

/**
 * تأییدِ کد + ثبتِ اکانت.
 *
 * همین یک تابع هم «ورود» است و هم «افزودن حساب»: اگر شناسهی کاربرِ پاسخ با
 * یکی از اکانت‌های دستگاه بخواند همان به‌روز می‌شود، وگرنه اسلاتِ تازه ساخته و
 * فعال می‌شود. پس اپ یک مسیرِ ورود دارد، نه دو تا — و همان مسیری که کاربر
 * نخستین‌بار از آن وارد شد، بعداً اکانتِ دوم را هم اضافه می‌کند.
 */
export const makeVerifyOtp =
  (repo: AuthRepository, session: SessionStore) =>
  async (phone: string, code: string): Promise<AuthResult> => {
    const result = await repo.verifyOtp(phone, code);
    await session.signInAccount(
      { userId: result.userId, phone },
      {
        access: result.accessToken,
        refresh: result.refreshToken,
        sessionId: result.sessionId,
      }
    );
    return result;
  };

const revokeAccountSession = async (
  repo: AuthRepository,
  session: SessionStore,
  id: string
): Promise<void> => {
  try {
    await repo.logout(id);
  } catch {
    // خروجِ محلی حتی هنگامِ قطعیِ شبکه باید ممکن بماند.
  }
};

/** خروج از اکانتِ فعال (اگر اکانتِ دیگری بماند، همان فعال می‌شود). */
export const makeLogout = (repo: AuthRepository, session: SessionStore) => async () => {
  const id = await session.getActiveAccountId();
  if (id) await revokeAccountSession(repo, session, id);
  await session.clear();
};

export const makeHasSession = (session: SessionStore) => async () =>
  Boolean(await session.getAccess());

export const makeGetCurrentSessionId = (session: SessionStore) => () => session.getSessionId();

export const makeListSessions = (repo: AuthRepository) => () => repo.listSessions();

export const makeRevokeSession = (repo: AuthRepository) => (sid: string) =>
  repo.revokeSession(sid);

// ─ چنداکانتی ────────────────────────────────────────────────
export const makeListAccounts = (session: SessionStore) => () => session.listAccounts();

export const makeCountAccounts = (session: SessionStore) => () => session.countAccounts();

export const makeGetActiveAccount = (session: SessionStore) => () =>
  session.getActiveAccount();

export const makeGetActiveAccountId = (session: SessionStore) => () =>
  session.getActiveAccountId();

export const makeSwitchAccount = (session: SessionStore) => (id: string) =>
  session.setActiveAccount(id);

export const makeLogoutAccount = (repo: AuthRepository, session: SessionStore) => async (id: string) => {
  await revokeAccountSession(repo, session, id);
  await session.removeAccount(id);
};

export const makeLogoutAll = (repo: AuthRepository, session: SessionStore) => async () => {
  const accounts = await session.listAccounts();
  await Promise.all(accounts.map((account) => revokeAccountSession(repo, session, account.id)));
  await session.removeAllAccounts();
};

export const makeUpdateAccountMeta =
  (session: SessionStore) => (id: string, patch: Partial<AccountMeta>) =>
    session.updateAccountMeta(id, patch);

export type AuthUseCases = {
  requestOtp: ReturnType<typeof makeRequestOtp>;
  verifyOtp: ReturnType<typeof makeVerifyOtp>;
  logout: ReturnType<typeof makeLogout>;
  hasSession: ReturnType<typeof makeHasSession>;
  getCurrentSessionId: ReturnType<typeof makeGetCurrentSessionId>;
  listSessions: ReturnType<typeof makeListSessions>;
  revokeSession: ReturnType<typeof makeRevokeSession>;
  listAccounts: ReturnType<typeof makeListAccounts>;
  countAccounts: ReturnType<typeof makeCountAccounts>;
  getActiveAccount: ReturnType<typeof makeGetActiveAccount>;
  getActiveAccountId: ReturnType<typeof makeGetActiveAccountId>;
  switchAccount: ReturnType<typeof makeSwitchAccount>;
  logoutAccount: ReturnType<typeof makeLogoutAccount>;
  logoutAll: ReturnType<typeof makeLogoutAll>;
  updateAccountMeta: ReturnType<typeof makeUpdateAccountMeta>;
};
