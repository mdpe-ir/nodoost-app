import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AccountIndex, AccountInput, AccountMeta, TokenPair } from '@/domain/entities/account';
import { jwtSubject } from '@/core/utils/jwt';

/**
 * نگه‌داریِ چند اکانت روی همین دستگاه.
 *
 * چرا کلیدِ جدا برای هر اکانت و نه یک شیءِ JSON بزرگ؟ چون SecureStore روی iOS
 * تاریخی مقادیرِ بالای ~۲۰۴۸ بایت را رد می‌کرد و چند JWT به‌سادگی از آن رد
 * می‌شود. ایندکس (`nd_accounts_v1`) هیچ توکنی ندارد، پس همیشه کوچک می‌ماند.
 *
 * روی وب همان قراردادِ TokenStorage قدیمی برقرار است: localStorage. این
 * محافظتِ کمتری از زنجیره‌ی کلیدِ سیستم دارد ولی تنها گزینه‌ی PWA است.
 */
const INDEX_KEY = 'nd_accounts_v1';
const LEGACY_ACCESS = 'nd_access';
const LEGACY_REFRESH = 'nd_refresh';

const accessKey = (id: string) => `nd_access_${id}`;
const refreshKey = (id: string) => `nd_refresh_${id}`;
const sessionKey = (id: string) => `nd_session_${id}`;

/** خواندنِ دفاعیِ ایندکس — ورودیِ خراب/قدیمی هرگز اپ را نمی‌شکند. */
function parseIndex(raw: string): AccountIndex | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  if (!Array.isArray(o.accounts)) return null;

  const accounts: AccountMeta[] = [];
  for (const item of o.accounts) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    const id = typeof a.id === 'string' && a.id ? a.id : null;
    const userId = typeof a.userId === 'number' ? a.userId : Number(a.userId);
    if (!id || !Number.isFinite(userId) || userId <= 0) continue;
    accounts.push({
      id,
      userId,
      phone: typeof a.phone === 'string' ? a.phone : '',
      name: typeof a.name === 'string' ? a.name : undefined,
      photoUrl: typeof a.photoUrl === 'string' ? a.photoUrl : undefined,
      status:
        a.status === 'active' || a.status === 'banned' || a.status === 'pending_review'
          ? a.status
          : undefined,
      addedAt: typeof a.addedAt === 'number' ? a.addedAt : Date.now(),
      lastUsedAt: typeof a.lastUsedAt === 'number' ? a.lastUsedAt : Date.now(),
    });
  }

  const activeId = typeof o.activeId === 'string' ? o.activeId : null;
  const known = accounts.some((a) => a.id === activeId);
  return {
    version: 1,
    // اشاره‌ی فعالِ بی‌هدف به معتبرترین اکانت اصلاح می‌شود.
    activeId: known ? activeId : (accounts[0]?.id ?? null),
    accounts,
  };
}

export class AccountStorage {
  private readonly web = Platform.OS === 'web';
  private index: AccountIndex = { version: 1, activeId: null, accounts: [] };
  /** یک‌بار آماده‌سازی (خواندنِ ایندکس + مهاجرتِ تک‌حسابی). */
  private ready: Promise<void> | null = null;
  /** صفِ نوشتن — هر «بخوان-تغییر-بنویس» روی ایندکس یکی پس از دیگری. */
  private queue: Promise<unknown> = Promise.resolve();

  // ── دسترسیِ خام ────────────────────────────────────────────────
  private async readRaw(key: string): Promise<string | null> {
    try {
      if (this.web) return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  private async writeRaw(key: string, value: string): Promise<void> {
    try {
      if (this.web) {
        globalThis.localStorage?.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      /* خطای ذخیره بی‌صدا رد می‌شود تا جریانِ کاربر نشکند */
    }
  }

  private async removeRaw(key: string): Promise<void> {
    try {
      if (this.web) {
        globalThis.localStorage?.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* noop */
    }
  }

  // ── آماده‌سازی و صف ────────────────────────────────────────────
  private ensureReady(): Promise<void> {
    if (!this.ready) this.ready = this.init();
    return this.ready;
  }

  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  /**
   * خواندنِ ایندکس؛ اگر نبود، مهاجرتِ کاربرِ نسخه‌ی تک‌حسابی.
   *
   * کاربرِ فعلی کلیدهای `nd_access`/`nd_refresh` دارد و هیچ ایندکسی ندارد.
   * شناسه‌ی کاربر از claimِ `sub` همان توکن خوانده میشود (بدونِ درخواستِ
   * شبکه)، پس ارتقا برای کاربر نامرئی است و بیرون نمی‌افتد.
   */
  private async init(): Promise<void> {
    const raw = await this.readRaw(INDEX_KEY);
    if (raw) {
      const parsed = parseIndex(raw);
      if (parsed) {
        this.index = parsed;
        return;
      }
    }

    const legacyAccess = await this.readRaw(LEGACY_ACCESS);
    const legacyRefresh = await this.readRaw(LEGACY_REFRESH);
    const userId = jwtSubject(legacyAccess);
    if (legacyAccess && userId) {
      const id = String(userId);
      const now = Date.now();
      this.index = {
        version: 1,
        activeId: id,
        accounts: [{ id, userId, phone: '', addedAt: now, lastUsedAt: now }],
      };
      await this.writeRaw(accessKey(id), legacyAccess);
      if (legacyRefresh) await this.writeRaw(refreshKey(id), legacyRefresh);
      await this.persistIndex();
    }
    // کلیدهای قدیمی در هر حالت پاک می‌شوند: کدِ تازه دیگر آن‌ها را نمی‌خواند و
    // ماندنشان فقط سردرگمی و رازِ اضافی روی دستگاه است.
    await this.removeRaw(LEGACY_ACCESS);
    await this.removeRaw(LEGACY_REFRESH);
  }

  private persistIndex(): Promise<void> {
    return this.writeRaw(INDEX_KEY, JSON.stringify(this.index));
  }

  private find(id: string | null): AccountMeta | null {
    if (!id) return null;
    return this.index.accounts.find((a) => a.id === id) ?? null;
  }

  /**
   * متادیتای اکانتِ فعال — برای نمایشِ نام/آواتار در صفحه‌ی قفل و برگه‌ی سوییچ.
   * `null` یعنی هنوز اکانتی وارد نشده (مهمان).
   */
  async getActiveAccount(): Promise<AccountMeta | null> {
    await this.ensureReady();
    const found = this.find(this.index.activeId);
    return found ? { ...found } : null;
  }

  // ─ توکن‌های اکانتِ فعال ─────────────────────────────────────
  async getAccess(): Promise<string | null> {
    await this.ensureReady();
    return this.index.activeId ? this.readRaw(accessKey(this.index.activeId)) : null;
  }

  async getRefresh(): Promise<string | null> {
    await this.ensureReady();
    return this.index.activeId ? this.readRaw(refreshKey(this.index.activeId)) : null;
  }

  async getSessionId(): Promise<string | null> {
    await this.ensureReady();
    return this.index.activeId ? this.readRaw(sessionKey(this.index.activeId)) : null;
  }

  // ── توکن‌های یک اکانتِ مشخص (برای refresh پس از سوییچ) ────────
  getAccessFor(id: string): Promise<string | null> {
    return this.ensureReady().then(() => this.readRaw(accessKey(id)));
  }

  getRefreshFor(id: string): Promise<string | null> {
    return this.ensureReady().then(() => this.readRaw(refreshKey(id)));
  }

  /**
   * ذخیره‌ی توکنهای یک اکانتِ مشخص.
   * `undefined` یعنی «دست نزن»، `null` یعنی «پاک کن» — تا refresh نتواند
   * توکنِ سالمی را بی‌دلیل حذف کند.
   */
  async saveFor(id: string, tokens: TokenPair): Promise<void> {
    await this.ensureReady();
    await this.writeRaw(accessKey(id), tokens.access);
    if (tokens.refresh === null) await this.removeRaw(refreshKey(id));
    else if (typeof tokens.refresh === 'string') await this.writeRaw(refreshKey(id), tokens.refresh);
    if (tokens.sessionId === null) await this.removeRaw(sessionKey(id));
    else if (typeof tokens.sessionId === 'string')
      await this.writeRaw(sessionKey(id), tokens.sessionId);
  }

  /** ذخیره‌ی توکن‌های اکانتِ فعال؛ اگر اکانتی نباشد از `sub` توکن ساخته می‌شود. */
  async save(access: string, refresh?: string, sessionId?: string | null): Promise<void> {
    await this.ensureReady();
    let id = this.index.activeId;
    if (!id) {
      const userId = jwtSubject(access);
      if (!userId) return; // توکنِ بی‌هویت جایی برای نشستن ندارد
      const now = Date.now();
      id = String(userId);
      this.index.accounts.push({ id, userId, phone: '', addedAt: now, lastUsedAt: now });
      this.index.activeId = id;
      await this.persistIndex();
    }
    await this.saveFor(id, { access, refresh, sessionId });
  }

  /**
   * خروج از اکانتِ فعال: توکن‌ها و اسلاتش پاک میشود و اگر اکانتِ دیگری مانده
   * باشد، جدیدترین به‌عنوان فعال انتخاب می‌شود (رفتارِ تلگرام).
   */
  async clear(): Promise<void> {
    await this.ensureReady();
    const id = this.index.activeId;
    if (id) await this.removeAccount(id);
  }
// ── مدیریتِ اکانت‌ها ──────────────────────────────────────────
  /** فهرستِ اکانت‌های دستگاه، به ترتیبِ افزودن (پایدار — مثلِ تلگرام). */
  async listAccounts(): Promise<AccountMeta[]> {
    await this.ensureReady();
    return this.index.accounts.map((a) => ({ ...a }));
  }

  async getActiveAccountId(): Promise<string | null> {
    await this.ensureReady();
    return this.index.activeId;
  }

  async getAccount(id: string): Promise<AccountMeta | null> {
    await this.ensureReady();
    const found = this.find(id);
    return found ? { ...found } : null;
  }

  /** تعدادِ اکانت‌های همین دستگاه — برای اعمالِ سقفِ سمتِ کلاینت. */
  async countAccounts(): Promise<number> {
    await this.ensureReady();
    return this.index.accounts.length;
  }

  async setActiveAccount(id: string): Promise<void> {
    await this.ensureReady();
    await this.serialize(async () => {
      const target = this.find(id);
      if (!target) return;
      target.lastUsedAt = Date.now();
      this.index.activeId = id;
      await this.persistIndex();
    });
  }

  /**
   * ثبتِ ورودِ یک اکانت: متادیتا را می‌سازد/به‌روز می‌کند، توکن‌ها را می‌نویسد
   * و همان اکانت را فعال می‌کند — نقطه‌ی یکتای ورود برای «ورود» و «افزودن حساب».
   */
  async signInAccount(input: AccountInput, tokens: TokenPair): Promise<AccountMeta | null> {
    await this.ensureReady();
    const userId = input.userId && input.userId > 0 ? input.userId : jwtSubject(tokens.access);
    if (!userId) return null;
    const id = String(userId);
    const now = Date.now();
    return this.serialize(async () => {
      const existing = this.find(id);
      let meta: AccountMeta;
      if (existing) {
        if (input.phone) existing.phone = input.phone;
        if (input.name !== undefined) existing.name = input.name;
        if (input.photoUrl !== undefined) existing.photoUrl = input.photoUrl;
        if (input.status !== undefined) existing.status = input.status;
        existing.lastUsedAt = now;
        meta = existing;
      } else {
        meta = {
          id,
          userId,
          phone: input.phone ?? '',
          name: input.name,
          photoUrl: input.photoUrl,
          status: input.status,
          addedAt: now,
          lastUsedAt: now,
        };
        this.index.accounts.push(meta);
      }
      this.index.activeId = id;
      await this.persistIndex();
      await this.saveFor(id, tokens);
      return { ...meta };
    });
  }
/**
   * به‌روزرسانیِ نام/شماره/آواتار پس از `GET /api/me`.
   * `id` و `userId` و `addedAt` عمداً قابلِ تغییر نیستند.
   */
  async updateAccountMeta(id: string, patch: Partial<AccountMeta>): Promise<void> {
    await this.ensureReady();
    await this.serialize(async () => {
      const target = this.find(id);
      if (!target) return;
      if (patch.phone !== undefined) target.phone = patch.phone;
      if (patch.name !== undefined) target.name = patch.name;
      if (patch.photoUrl !== undefined) target.photoUrl = patch.photoUrl;
      if (patch.status !== undefined) target.status = patch.status;
      if (patch.lastUsedAt !== undefined) target.lastUsedAt = patch.lastUsedAt;
      await this.persistIndex();
    });
  }

  /**
   * حذفِ یک اکانت از دستگاه. اگر فعال بوده، جدیدترین اکانتِ باقیمانده جانشینش
   * می‌شود و اگر چیزی نمانده باشد، اپ مهمان می‌شود.
   */
  async removeAccount(id: string): Promise<void> {
    await this.ensureReady();
    await this.serialize(async () => {
      const before = this.index.accounts.length;
      this.index.accounts = this.index.accounts.filter((a) => a.id !== id);
      if (this.index.accounts.length === before) return;
      if (this.index.activeId === id) {
        const next = [...this.index.accounts].sort((a, b) => b.lastUsedAt - a.lastUsedAt)[0];
        this.index.activeId = next?.id ?? null;
      }
      await this.persistIndex();
    });
    await this.removeRaw(accessKey(id));
    await this.removeRaw(refreshKey(id));
    await this.removeRaw(sessionKey(id));
  }

  /** خروجِ کامل از همهی اکانت‌ها («فراموشیِ رمز» و پاک‌سازیِ محلی). */
  async removeAllAccounts(): Promise<void> {
    await this.ensureReady();
    const ids = this.index.accounts.map((a) => a.id);
    await this.serialize(async () => {
      this.index = { version: 1, activeId: null, accounts: [] };
      await this.persistIndex();
    });
    for (const id of ids) {
      await this.removeRaw(accessKey(id));
      await this.removeRaw(refreshKey(id));
      await this.removeRaw(sessionKey(id));
    }
  }
  }

/**
 * نمونه‌ی مشترکِ کلِ اپ — `chatMedia` و کانتینرِ DI باید یک ایندکس داشته باشند،
 * وگرنه دو نسخه از حافظه‌ی درون‌برنامه‌ای با هم اختلاف پیدا می‌کنند.
 */
export const accountStorage = new AccountStorage();
