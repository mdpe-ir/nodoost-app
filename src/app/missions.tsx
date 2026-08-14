import { Redirect, type Href } from 'expo-router';

/**
 * ماموریت‌ها به تبِ «قهرمانی» منتقل شده‌اند.
 *
 * مسیر حذف نمی‌شود چون اعلان‌های ساخته‌شده پیش از این تغییر هنوز LinkURL برابر
 * «/missions» دارند و در فیدِ کاربر نشسته‌اند؛ حذفِ مسیر یعنی زدنِ آن اعلان‌ها
 * به صفحه‌ی خالی می‌رسد.
 */
export default function MissionsRedirect() {
  return <Redirect href={"/arena" as Href} />;
}
