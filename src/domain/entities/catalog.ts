/** سطحِ عضویت (تایر) برای نمایش و خرید. */
export interface Tier {
  id: string;
  level: number;
  name: string;
  priceToman?: number;
  amountRial?: number;
}
