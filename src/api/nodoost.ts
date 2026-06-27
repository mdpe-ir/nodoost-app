import { api, uploadPhoto } from './client';
import type { Me, Candidate, Conversation, Message, Photo, TierPlan } from '@/types';

export const Auth = {
  requestOtp: (phone: string) =>
    api<{ debug_code?: string }>('/api/auth/request-otp', {
      method: 'POST',
      auth: false,
      body: { phone },
    }),
  verifyOtp: (phone: string, code: string) =>
    api<{ access_token: string; refresh_token?: string; profile_complete?: boolean }>(
      '/api/auth/verify-otp',
      { method: 'POST', auth: false, body: { phone, code } }
    ),
};

export const Profile = {
  me: () => api<Me>('/api/me'),
  update: (patch: Partial<Me>) => api<Me>('/api/me', { method: 'PATCH', body: patch }),
  remove: () => api('/api/me', { method: 'DELETE' }),
  setLocation: (lat: number, lng: number) =>
    api('/api/me/location', { method: 'POST', body: { lat, lng } }),
  photos: () => api<{ photos: Photo[] }>('/api/me/photos').then((d) => d?.photos ?? []),
  addPhoto: (uri: string) => uploadPhoto(uri),
  deletePhoto: (id: number) => api('/api/me/photos/' + id, { method: 'DELETE' }),
  requestReview: () => api('/api/me/request-review', { method: 'POST', body: {} }),
  registerDevice: (token: string, platform: string) =>
    api('/api/me/devices', { method: 'POST', body: { token, platform } }),
};

export const Discovery = {
  list: () => api<{ results: Candidate[] }>('/api/discovery').then((d) => d?.results ?? []),
  swipe: (targetId: number, action: 'like' | 'super' | 'pass') =>
    api<{ match?: { match_id: number; peer?: Candidate } }>('/api/swipes', {
      method: 'POST',
      body: { target_id: targetId, action },
    }),
};

export const Likes = {
  list: () =>
    api<{ count: number; revealed: boolean; results: Candidate[] }>('/api/me/likes'),
};

export const Random = {
  join: (filters?: { gender?: string; max_distance_m?: number }) =>
    api<{ status: 'waiting' | 'matched'; match_id?: number; peer?: Candidate }>(
      '/api/random/join',
      { method: 'POST', body: filters || {} }
    ),
  leave: () => api('/api/random/leave', { method: 'POST', body: {} }),
  status: () => api<{ status: string }>('/api/random/status'),
};

export const Chat = {
  conversations: () =>
    api<{ conversations: Conversation[] }>('/api/matches').then((d) => d?.conversations ?? []),
  messages: (matchId: number) =>
    api<{ messages: Message[] }>('/api/matches/' + matchId + '/messages').then(
      (d) => d?.messages ?? []
    ),
  send: (matchId: number, body: string) =>
    api<Message>('/api/matches/' + matchId + '/messages', { method: 'POST', body: { body } }),
};

export const Tiers = {
  list: () => api<{ tiers: TierPlan[] }>('/api/tiers').then((d) => d?.tiers ?? []),
};

export const Payments = {
  plans: () => api<unknown>('/api/payments/plans'),
  zarinpalRequest: (plan: string) =>
    api<{ pay_url: string }>('/api/payments/zarinpal/request', { method: 'POST', body: { plan } }),
};

export const Safety = {
  block: (id: number) => api('/api/safety/block', { method: 'POST', body: { target_id: id } }),
  report: (id: number, reason: string) =>
    api('/api/safety/report', { method: 'POST', body: { target_id: id, reason } }),
};
