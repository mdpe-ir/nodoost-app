/** یک صفحه از یک فهرستِ صفحه‌بندی‌شده. */
export interface Page<T> {
  items: T[];
  page: number;
  /** آیا صفحه‌ی بعدی هم هست. */
  hasMore: boolean;
  /** تعدادِ کلِ ردیف‌ها اگر سرور بدهد (برای سرخط‌ها). */
  total?: number;
}
