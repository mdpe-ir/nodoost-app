import type { User, ProfileDraft, Photo } from '@/domain/entities';

export interface ProfileRepository {
  getMe(): Promise<User>;
  updateProfile(draft: ProfileDraft): Promise<User>;
  deleteAccount(): Promise<void>;
  setLocation(lat: number, lng: number): Promise<void>;
  /** حالتِ سفر (الماس): قفلِ موقعیت روی شهرِ دلخواه. */
  setTravelLocation(lat: number, lng: number): Promise<void>;
  /** خروج از حالتِ سفر و بازگشت به موقعیتِ واقعی. */
  clearTravel(lat: number, lng: number): Promise<void>;
  getPhotos(): Promise<Photo[]>;
  /** عکسِ تازه را آپلود می‌کند و همان عکسِ ساخته‌شده را برمی‌گرداند. */
  addPhoto(uri: string): Promise<Photo | null>;
  deletePhoto(id: number): Promise<void>;
  /** عکسِ پیش‌فرضِ پروفایل (چهره‌ی کاربر در همه‌ی صفحه‌ها) را عوض می‌کند. */
  setPrimaryPhoto(id: number): Promise<void>;
  requestReview(): Promise<void>;
  registerDevice(token: string, platform: string): Promise<void>;
}
