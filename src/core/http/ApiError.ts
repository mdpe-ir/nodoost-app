/** خطای یکدستِ لایه‌ی شبکه. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }

  get isAuth(): boolean {
    return this.status === 401;
  }
  get isLimitReached(): boolean {
    return this.status === 402;
  }
}
