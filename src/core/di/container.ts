import { env } from '@/core/config/env';
import { TokenStorage } from '@/core/storage/TokenStorage';
import { HttpClient } from '@/core/http/HttpClient';

import { AuthRepositoryImpl } from '@/data/repositories/AuthRepositoryImpl';
import { ProfileRepositoryImpl } from '@/data/repositories/ProfileRepositoryImpl';
import { DiscoveryRepositoryImpl } from '@/data/repositories/DiscoveryRepositoryImpl';
import { LikesRepositoryImpl } from '@/data/repositories/LikesRepositoryImpl';
import { ChatRepositoryImpl } from '@/data/repositories/ChatRepositoryImpl';
import { RandomRepositoryImpl } from '@/data/repositories/RandomRepositoryImpl';
import { CatalogRepositoryImpl } from '@/data/repositories/CatalogRepositoryImpl';
import { SafetyRepositoryImpl } from '@/data/repositories/SafetyRepositoryImpl';
import { NotificationsRepositoryImpl } from '@/data/repositories/NotificationsRepositoryImpl';
import { InAppMessagesRepositoryImpl } from '@/data/repositories/InAppMessagesRepositoryImpl';
import { FollowRepositoryImpl } from '@/data/repositories/FollowRepositoryImpl';
import { SupportRepositoryImpl } from '@/data/repositories/SupportRepositoryImpl';
import { QuotaRepositoryImpl } from '@/data/repositories/QuotaRepositoryImpl';
import { ReviewPromptRepositoryImpl } from '@/data/repositories/ReviewPromptRepositoryImpl';
import { MissionsRepositoryImpl } from '@/data/repositories/MissionsRepositoryImpl';

import * as auth from '@/domain/usecases/authUseCases';
import * as profile from '@/domain/usecases/profileUseCases';
import * as discovery from '@/domain/usecases/discoveryUseCases';
import * as likes from '@/domain/usecases/likesUseCases';
import * as chat from '@/domain/usecases/chatUseCases';
import * as random from '@/domain/usecases/randomUseCases';
import * as catalog from '@/domain/usecases/catalogUseCases';
import * as safety from '@/domain/usecases/safetyUseCases';
import * as notifications from '@/domain/usecases/notificationsUseCases';
import * as inAppMessages from '@/domain/usecases/inAppMessagesUseCases';
import * as follow from '@/domain/usecases/followUseCases';
import * as support from '@/domain/usecases/supportUseCases';
import * as quota from '@/domain/usecases/quotaUseCases';
import * as reviewPrompt from '@/domain/usecases/reviewPromptUseCases';
import * as missions from '@/domain/usecases/missionsUseCases';

/**
 * Composition root: زیرساخت → repository → use case را یک‌بار می‌سازد.
 * این تنها جایی است که پیاده‌سازی‌های concrete به هم وصل می‌شوند.
 */
export function createContainer() {
  const tokens = new TokenStorage();
  const http = new HttpClient(env.apiBaseUrl, tokens);

  const authRepo = new AuthRepositoryImpl(http);
  const profileRepo = new ProfileRepositoryImpl(http);
  const discoveryRepo = new DiscoveryRepositoryImpl(http);
  const likesRepo = new LikesRepositoryImpl(http);
  const chatRepo = new ChatRepositoryImpl(http);
  const randomRepo = new RandomRepositoryImpl(http);
  const catalogRepo = new CatalogRepositoryImpl(http);
  const safetyRepo = new SafetyRepositoryImpl(http);
  const notificationsRepo = new NotificationsRepositoryImpl(http);
  const inAppMessagesRepo = new InAppMessagesRepositoryImpl(http);
  const followRepo = new FollowRepositoryImpl(http);
  const supportRepo = new SupportRepositoryImpl(http);
  const quotaRepo = new QuotaRepositoryImpl(http);
  const reviewPromptRepo = new ReviewPromptRepositoryImpl(http);
  const missionsRepo = new MissionsRepositoryImpl(http);

  const useCases = {
    auth: {
      requestOtp: auth.makeRequestOtp(authRepo),
      verifyOtp: auth.makeVerifyOtp(authRepo, tokens),
      logout: auth.makeLogout(tokens),
      hasSession: auth.makeHasSession(tokens),
    },
    profile: {
      getMe: profile.makeGetMe(profileRepo),
      updateProfile: profile.makeUpdateProfile(profileRepo),
      setLocation: profile.makeSetLocation(profileRepo),
      setTravelLocation: profile.makeSetTravelLocation(profileRepo),
      clearTravel: profile.makeClearTravel(profileRepo),
      getPhotos: profile.makeGetPhotos(profileRepo),
      addPhoto: profile.makeAddPhoto(profileRepo),
      deletePhoto: profile.makeDeletePhoto(profileRepo),
      setPrimaryPhoto: profile.makeSetPrimaryPhoto(profileRepo),
      deleteAccount: profile.makeDeleteAccount(profileRepo),
      requestReview: profile.makeRequestReview(profileRepo),
      registerDevice: profile.makeRegisterDevice(profileRepo),
    },
    discovery: {
      getCandidates: discovery.makeGetCandidates(discoveryRepo),
      getExplore: discovery.makeGetExplore(discoveryRepo),
      getNearbyMapUsers: discovery.makeGetNearbyMapUsers(discoveryRepo),
      swipe: discovery.makeSwipe(discoveryRepo),
      unswipe: discovery.makeUnswipe(discoveryRepo),
      getPeerProfile: discovery.makeGetPeerProfile(discoveryRepo),
    },
    likes: {
      getLikes: likes.makeGetLikes(likesRepo),
      getSentLikes: likes.makeGetSentLikes(likesRepo),
      getViewers: likes.makeGetViewers(likesRepo),
    },
    chat: {
      getConversations: chat.makeGetConversations(chatRepo),
      getMessages: chat.makeGetMessages(chatRepo),
      sendMessage: chat.makeSendMessage(chatRepo),
      startDirect: chat.makeStartDirect(chatRepo),
      editMessage: chat.makeEditMessage(chatRepo),
      deleteMessage: chat.makeDeleteMessage(chatRepo),
      clearChat: chat.makeClearChat(chatRepo),
      getPresence: chat.makeGetPresence(chatRepo),
      sendTyping: chat.makeSendTyping(chatRepo),
    },
    random: {
      join: random.makeJoinRandom(randomRepo),
      leave: random.makeLeaveRandom(randomRepo),
    },
    catalog: {
      getTiers: catalog.makeGetTiers(catalogRepo),
      startPayment: catalog.makeStartPayment(catalogRepo),
      verifyBazaarPurchase: catalog.makeVerifyBazaarPurchase(catalogRepo),
      restoreBazaarPurchase: catalog.makeRestoreBazaarPurchase(catalogRepo),
      reportBazaarSweep: catalog.makeReportBazaarSweep(catalogRepo),
    },
    safety: {
      block: safety.makeBlockUser(safetyRepo),
      unblock: safety.makeUnblockUser(safetyRepo),
      getBlocks: safety.makeGetBlocks(safetyRepo),
      report: safety.makeReportUser(safetyRepo),
    },
    notifications: {
      list: notifications.makeGetNotifications(notificationsRepo),
      markSeen: notifications.makeMarkNotificationsSeen(notificationsRepo),
      markRead: notifications.makeMarkNotificationsRead(notificationsRepo),
      markAllRead: notifications.makeMarkAllNotificationsRead(notificationsRepo),
      getBadges: notifications.makeGetBadges(notificationsRepo),
      getPrefs: notifications.makeGetNotificationPrefs(notificationsRepo),
      updatePrefs: notifications.makeUpdateNotificationPrefs(notificationsRepo),
    },
    inAppMessages: {
      list: inAppMessages.makeGetInAppMessages(inAppMessagesRepo),
      recordEvent: inAppMessages.makeRecordInAppEvent(inAppMessagesRepo),
    },
    follow: {
      follow: follow.makeFollow(followRepo),
      unfollow: follow.makeUnfollow(followRepo),
      getList: follow.makeGetFollowList(followRepo),
      removeFollower: follow.makeRemoveFollower(followRepo),
    },
    support: {
      getOverview: support.makeGetSupportOverview(supportRepo),
      startThread: support.makeStartSupportThread(supportRepo),
      getMessages: support.makeGetSupportMessages(supportRepo),
      sendMessage: support.makeSendSupportMessage(supportRepo),
    },
    quota: {
      get: quota.makeGetQuota(quotaRepo),
    },
    reviewPrompt: {
      get: reviewPrompt.makeGetReviewPrompt(reviewPromptRepo),
      report: reviewPrompt.makeReportReviewPrompt(reviewPromptRepo),
    },
    missions: {
      getMissions: missions.makeGetMissions(missionsRepo),
      getMission: missions.makeGetMission(missionsRepo),
      getLeaderboard: missions.makeGetLeaderboard(missionsRepo),
      startMission: missions.makeStartMission(missionsRepo),
      uploadProof: missions.makeUploadProof(missionsRepo),
      deleteProof: missions.makeDeleteProof(missionsRepo),
      claimMission: missions.makeClaimMission(missionsRepo),
      getPoints: missions.makeGetPoints(missionsRepo),
      getRewards: missions.makeGetRewards(missionsRepo),
      redeemReward: missions.makeRedeemReward(missionsRepo),
      getRedemptions: missions.makeGetRedemptions(missionsRepo),
      getReferral: missions.makeGetReferral(missionsRepo),
      redeemReferralCode: missions.makeRedeemReferralCode(missionsRepo),
    },
  };

  return { useCases, tokens };
}

export type Container = ReturnType<typeof createContainer>;
export type UseCases = Container['useCases'];
