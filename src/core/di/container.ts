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
import { FollowRepositoryImpl } from '@/data/repositories/FollowRepositoryImpl';

import * as auth from '@/domain/usecases/authUseCases';
import * as profile from '@/domain/usecases/profileUseCases';
import * as discovery from '@/domain/usecases/discoveryUseCases';
import * as likes from '@/domain/usecases/likesUseCases';
import * as chat from '@/domain/usecases/chatUseCases';
import * as random from '@/domain/usecases/randomUseCases';
import * as catalog from '@/domain/usecases/catalogUseCases';
import * as safety from '@/domain/usecases/safetyUseCases';
import * as notifications from '@/domain/usecases/notificationsUseCases';
import * as follow from '@/domain/usecases/followUseCases';

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
  const followRepo = new FollowRepositoryImpl(http);

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
    },
    random: {
      join: random.makeJoinRandom(randomRepo),
      leave: random.makeLeaveRandom(randomRepo),
    },
    catalog: {
      getTiers: catalog.makeGetTiers(catalogRepo),
      startPayment: catalog.makeStartPayment(catalogRepo),
      verifyBazaarPurchase: catalog.makeVerifyBazaarPurchase(catalogRepo),
    },
    safety: {
      block: safety.makeBlockUser(safetyRepo),
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
    follow: {
      follow: follow.makeFollow(followRepo),
      unfollow: follow.makeUnfollow(followRepo),
      getList: follow.makeGetFollowList(followRepo),
    },
  };

  return { useCases, tokens };
}

export type Container = ReturnType<typeof createContainer>;
export type UseCases = Container['useCases'];
