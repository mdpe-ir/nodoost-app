/** خطای یکدستِ لایه‌ی شبکه. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    /**
     * بدنه‌ی خطا، دست‌نخورده — سرور کنارِ کدِ خطا داده‌ی زمینه هم می‌فرستد
     * (مثلاً `limit` و `required_tier`). بدونِ نگه‌داشتنش، پنجره‌ی ارتقا مجبور
     * می‌شد همان عددها را دوباره حدس بزند.
     */
    public readonly payload?: Record<string, unknown>
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

  /** عددِ همراهِ خطا (مثلاً سقفِ روزانه) — اگر نبود undefined. */
  num(field: string): number | undefined {
    const v = this.payload?.[field];
    return typeof v === 'number' ? v : undefined;
  }
}
