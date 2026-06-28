import type { ProfileRepository } from '@/domain/repositories/ProfileRepository';
import type { ProfileDraft } from '@/domain/entities';

export const makeGetMe = (r: ProfileRepository) => () => r.getMe();
export const makeUpdateProfile = (r: ProfileRepository) => (draft: ProfileDraft) =>
  r.updateProfile(draft);
export const makeSetLocation = (r: ProfileRepository) => (lat: number, lng: number) =>
  r.setLocation(lat, lng);
export const makeGetPhotos = (r: ProfileRepository) => () => r.getPhotos();
export const makeAddPhoto = (r: ProfileRepository) => (uri: string) => r.addPhoto(uri);
export const makeDeletePhoto = (r: ProfileRepository) => (id: number) => r.deletePhoto(id);
export const makeDeleteAccount = (r: ProfileRepository) => () => r.deleteAccount();
export const makeRequestReview = (r: ProfileRepository) => () => r.requestReview();
export const makeRegisterDevice =
  (r: ProfileRepository) => (token: string, platform: string) =>
    r.registerDevice(token, platform);

export type ProfileUseCases = {
  getMe: ReturnType<typeof makeGetMe>;
  updateProfile: ReturnType<typeof makeUpdateProfile>;
  setLocation: ReturnType<typeof makeSetLocation>;
  getPhotos: ReturnType<typeof makeGetPhotos>;
  addPhoto: ReturnType<typeof makeAddPhoto>;
  deletePhoto: ReturnType<typeof makeDeletePhoto>;
  deleteAccount: ReturnType<typeof makeDeleteAccount>;
  requestReview: ReturnType<typeof makeRequestReview>;
  registerDevice: ReturnType<typeof makeRegisterDevice>;
};
