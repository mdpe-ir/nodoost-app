import type { MissionsRepository } from '@/domain/repositories/MissionsRepository';
import type { LeaderWindow } from '@/domain/entities';

export const makeGetMissions = (r: MissionsRepository) => () => r.getMissions();

export const makeGetLeaderboard =
  (r: MissionsRepository) => (window: LeaderWindow) => r.getLeaderboard(window);

export const makeGetMission = (r: MissionsRepository) => (missionId: number) =>
  r.getMission(missionId);

export const makeStartMission = (r: MissionsRepository) => (missionId: number) =>
  r.startMission(missionId);

export const makeUploadProof =
  (r: MissionsRepository) => (missionId: number, uri: string) =>
    r.uploadProof(missionId, uri);

export const makeDeleteProof = (r: MissionsRepository) => (proofId: number) =>
  r.deleteProof(proofId);

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
  getMission: ReturnType<typeof makeGetMission>;
  getLeaderboard: ReturnType<typeof makeGetLeaderboard>;
  startMission: ReturnType<typeof makeStartMission>;
  uploadProof: ReturnType<typeof makeUploadProof>;
  deleteProof: ReturnType<typeof makeDeleteProof>;
  claimMission: ReturnType<typeof makeClaimMission>;
  getPoints: ReturnType<typeof makeGetPoints>;
  getRewards: ReturnType<typeof makeGetRewards>;
  redeemReward: ReturnType<typeof makeRedeemReward>;
  getRedemptions: ReturnType<typeof makeGetRedemptions>;
  getReferral: ReturnType<typeof makeGetReferral>;
  redeemReferralCode: ReturnType<typeof makeRedeemReferralCode>;
};
