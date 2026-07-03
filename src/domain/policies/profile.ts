import type { User } from '@/domain/entities';

/**
 * پروفایل برای استفاده از اپ کامل است؟ نام، جنسیت، تاریخِ تولد و حداقل یک عکس لازم است.
 * (درباره‌ات/bio اختیاری است.) کاربرانی که این‌ها را ندارند اول باید تکمیل کنند.
 */
export function isProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    !!user.name?.trim() &&
    !!user.gender &&
    !!user.birthdate &&
    (user.photos?.length ?? 0) > 0
  );
}

/** آیا کاربر حداقل یک عکسِ تأییدشده دارد (برای نمایش به دیگران). */
export function hasApprovedPhoto(user: User | null | undefined): boolean {
  return !!user?.photos?.some((p) => p.status === 'approved');
}

/** آیا کاربر عکسی در انتظارِ تأیید دارد. */
export function hasPendingPhoto(user: User | null | undefined): boolean {
  return !!user?.photos?.some((p) => p.status === 'pending' || p.status == null);
}
