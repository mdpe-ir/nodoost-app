/** انتزاعِ نگه‌داریِ نشست؛ زیرساخت (TokenStorage) آن را برآورده می‌کند. */
export interface SessionStore {
  save(access: string, refresh?: string): Promise<void>;
  clear(): Promise<void>;
  getAccess(): Promise<string | null>;
}
