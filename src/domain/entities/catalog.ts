/** سطحِ عضویت (تایر) برای نمایش و خرید. */
export interface Tier {
  id: string;
  level: number;
  name: string;
  priceToman?: number;
  amountRial?: number;
  /** SKUِ محصولِ درون‌برنامه‌ای در کافه‌بازار (اگر خالی باشد، همان id/code). */
  bazaarSku?: string;
  /** مدتِ اعتبارِ اشتراک به روز. */
  days?: number;
  /** بولت‌های توضیحیِ سطح (قابلِ ویرایش در پنلِ ادمین). */
  perks: string[];
  /** سقفِ سوایپِ روزانه؛ null = نامحدود. */
  dailySwipeLimit: number | null;
  /** سقفِ شروعِ گفتگو در روز؛ null = نامحدود. */
  dailyConversationLimit: number | null;
  /** سقفِ چتِ شانسی در روز؛ null = نامحدود. */
  dailyRandomLimit: number | null;
  superLikesPerDay: number;
  /** دیدنِ فهرستِ کاملِ پسندکنندگان. */
  canSeeLikes: boolean;
  /** فیلترِ جنسیت در چتِ شانسی. */
  canFilterRandomGender: boolean;
  maxRadiusKm: number;
  boostPerMonth: number;
}
