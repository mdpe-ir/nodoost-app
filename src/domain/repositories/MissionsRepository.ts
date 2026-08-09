import type {
  MissionsOverview,
  Mission,
  PointEntry,
  PointsState,
  RedeemResult,
  Redemption,
  ReferralOverview,
  RewardsOverview,
} from '@/domain/entities';

export interface MissionsRepository {
  /** ماموریت‌ها + وضعیتِ من + امتیاز + کارتِ دعوت. */
  getMissions(): Promise<MissionsOverview>;
  /** honor: «برو انجام بده» — تایمرِ بررسی را مسلح می‌کند. */
  startMission(missionId: number): Promise<Mission>;
  /** honor: دریافتِ امتیاز، یا manual: فرستادنِ مدرک. */
  claimMission(missionId: number, proof?: string): Promise<{ mission: Mission; points: PointsState }>;

  /** امتیاز و دفترِ من. */
  getPoints(page?: number): Promise<{ points: PointsState; ledger: PointEntry[]; total: number }>;

  getRewards(): Promise<RewardsOverview>;
  /** idemKey از سمتِ اپ می‌آید تا ارسالِ دوباره‌ی همان درخواست دو جایزه ندهد. */
  redeemReward(rewardId: number, idemKey: string, userInput?: string): Promise<RedeemResult>;
  getRedemptions(page?: number): Promise<{ items: Redemption[]; total: number }>;

  getReferral(page?: number): Promise<ReferralOverview>;
  /** واردکردنِ کدِ دعوتِ کسِ دیگر. */
  redeemReferralCode(code: string, deviceId?: string): Promise<PointsState>;
}
