import type {
  MissionsOverview,
  Mission,
  MissionProof,
  Leaderboard,
  LeaderWindow,
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
  /** جدولِ رتبه‌بندیِ یک بازه + جایگاهِ خودِ من. */
  getLeaderboard(window: LeaderWindow): Promise<Leaderboard>;
  /** صفحه‌ی جزئیات: توضیح، مراحل، قوانین، مدرک‌ها و وضعیتِ من. */
  getMission(missionId: number): Promise<Mission>;
  /** honor: «برو انجام بده». manual: ردیفِ دوره را می‌سازد تا مدرک جا داشته باشد. */
  startMission(missionId: number): Promise<Mission>;
  /** یک عکسِ مدرک برای ماموریتِ دستی. قبل از claim صدا زده می‌شود. */
  uploadProof(missionId: number, uri: string): Promise<MissionProof>;
  /** برداشتنِ عکس پیش از ارسال یا بعد از رد شدن. */
  deleteProof(proofId: number): Promise<void>;
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
