import type { ProfileRepository } from '@/domain/repositories/ProfileRepository';
import type { User, ProfileDraft, Photo } from '@/domain/entities';
import type { HttpClient } from '@/core/http/HttpClient';
import type { UserDTO, PhotoDTO } from '@/data/dto';
import { toUser, toPhoto, fromProfileDraft } from '@/data/mappers';

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private readonly http: HttpClient) {}

  async getMe(): Promise<User> {
    return toUser(await this.http.request<UserDTO>('/api/me'));
  }

  async updateProfile(draft: ProfileDraft): Promise<User> {
    await this.http.request('/api/me', {
      method: 'PATCH',
      body: fromProfileDraft(draft),
    });
    return this.getMe();
  }

  async deleteAccount(): Promise<void> {
    await this.http.request('/api/me', { method: 'DELETE' });
  }

  async setLocation(lat: number, lng: number): Promise<void> {
    await this.http.request('/api/me/location', { method: 'PUT', body: { lat, lng } });
  }

  async setTravelLocation(lat: number, lng: number): Promise<void> {
    await this.http.request('/api/me/location', {
      method: 'PUT',
      body: { lat, lng, travel: true },
    });
  }

  async clearTravel(lat: number, lng: number): Promise<void> {
    await this.http.request('/api/me/location', {
      method: 'PUT',
      body: { lat, lng, clear_travel: true },
    });
  }

  async getPhotos(): Promise<Photo[]> {
    const d = await this.http.request<{ photos: PhotoDTO[] }>('/api/me/photos');
    return (d?.photos ?? []).map(toPhoto);
  }

  async addPhoto(uri: string): Promise<void> {
    await this.http.upload('/api/me/photos', uri);
  }

  async deletePhoto(id: number): Promise<void> {
    await this.http.request(`/api/me/photos/${id}`, { method: 'DELETE' });
  }

  async requestReview(): Promise<void> {
    await this.http.request('/api/me/request-review', { method: 'POST', body: {} });
  }

  async registerDevice(token: string, platform: string): Promise<void> {
    await this.http.request('/api/me/devices', { method: 'POST', body: { token, platform } });
  }
}
