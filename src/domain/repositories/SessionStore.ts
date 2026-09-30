import type { AccountInput, AccountMeta, TokenPair } from '@/domain/entities';

/**
 * انتزاعِ نگه‌داریِ نشست؛ زیرساخت (`AccountStorage`) آن را برآورده می‌کند.
 *
 * از نسخه‌ی چنداکانتی، «نشست» دیگر یک جفت توکن نیست: دستگاهی می‌تواند چند
 * اکانت داشته باشد. متدهای تازه همین را پوشش می‌دهند و متدهای قدیمی با همان
 * امضا مانده‌اند تا کدِ موجود نشکند.
 */
export interface SessionStore {
  // ── اکانتِ فعال ─────────────────────────────────────────
  getAccess(): Promise<string | null>;
  getRefresh(): Promise<string | null>;
  getSessionId(): Promise<string | null>;
  /** ذخیرهی توکن‌های اکانتِ فعال؛ اگر اکانتی نبود از `sub` توکن ساخته می‌شود. */
  save(access: string, refresh?: string, sessionId?: string | null): Promise<void>;
  /** خروج از اکانتِ فعال. */
  clear(): Promise<void>;

  // ── توکن‌های یک اکانتِ مشخص (برای refresh پس از سوییچ) ───
  getAccessFor(id: string): Promise<string | null>;
  getRefreshFor(id: string): Promise<string | null>;
  saveFor(id: string, tokens: TokenPair): Promise<void>;

  // ── چنداکانتی ────────────────────────────────────────────
  listAccounts(): Promise<AccountMeta[]>;
  countAccounts(): Promise<number>;
  getActiveAccountId(): Promise<string | null>;
  getActiveAccount(): Promise<AccountMeta | null>;
  getAccount(id: string): Promise<AccountMeta | null>;
  setActiveAccount(id: string): Promise<void>;
  /** ورود/افزودن اکانت: متادیتا + توکن‌ها، و همان اکانت فعال می‌شود. */
  signInAccount(input: AccountInput, tokens: TokenPair): Promise<AccountMeta | null>;
  updateAccountMeta(id: string, patch: Partial<AccountMeta>): Promise<void>;
  removeAccount(id: string): Promise<void>;
  removeAllAccounts(): Promise<void>;
}
