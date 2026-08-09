import type { MissionsRepository } from '@/domain/repositories/MissionsRepository';

export const makeGetMissions = (r: MissionsRepository) => () => r.getMissions();

export const makeStartMission = (r: MissionsRepository) => (missionId: number) =>
  r.startMission(missionId);

export const makeClaimMission =
  (r: MissionsRepository) => (missionId: number, proof?: string) =>
    r.claimMission(missionId, proof);

export const makeGetPoints = (r: MissionsRepository) => (page = 1) => r.getPoints(page);

export const makeGetRewards = (r: MissionsRepository) => () => r.getRewards();

export const makeRedeemReward =
  (r: MissionsRepository) => (rewardId: number, idemKey: string, userInput?: string) =>
    r.redeemReward(rewardId, idemKey, userInput);

export const makeGetRedemptions = (r: MissionsRepository) => (page = 1) =>
  r.getRedemptions(page);

export const makeGetReferral = (r: MissionsRepository) => (page = 1) => r.getReferral(page);

export const makeRedeemReferralCode =
  (r: MissionsRepository) => (code: string, deviceId?: string) =>
    r.redeemReferralCode(code, deviceId);

export type MissionsUseCases = {
  getMissions: ReturnType<typeof makeGetMissions>;
  startMission: ReturnType<typeof makeStartMission>;
  claimMission: ReturnType<typeof makeClaimMission>;
  getPoints: ReturnType<typeof makeGetPoints>;
  getRewards: ReturnType<typeof makeGetRewards>;
  redeemReward: ReturnType<typeof makeRedeemReward>;
  getRedemptions: ReturnType<typeof makeGetRedemptions>;
  getReferral: ReturnType<typeof makeGetReferral>;
  redeemReferralCode: ReturnType<typeof makeRedeemReferralCode>;
};
