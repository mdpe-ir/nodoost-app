# نودوست — اپلیکیشنِ موبایل (React Native + Expo)

بازنویسیِ کاملِ فرانت‌اندِ نودوست با **معماریِ تمیزِ ساده و کاربردی**.
خروجی: **اندروید** (از طریقِ Expo) و **PWA برای iOS** (وب).

## اجرا

```bash
npm install
npx expo install --fix     # قفل‌کردنِ نسخه‌ها روی نسخه‌ی دقیقِ سازگار با SDK
npx expo start             # دیتای تایپِ مسیرها (typed routes) هم همین‌جا ساخته می‌شود
npm run typecheck          # بررسیِ نوع‌ها (پس از expo start اجرا کن)
```

- اندروید: `npm run android`
- وب/PWA: `npm run export:web`  (خروجی در `dist/` — قابلِ میزبانی روی هر وب‌سرور)

## پیکربندیِ آدرسِ سرور

آدرسِ بک‌اند در `app.json` → `expo.extra.apiBaseUrl` تعریف شده است
(پیش‌فرض: `https://nodoost.ir`). برای توسعه‌ی محلی آن را به آدرسِ سرورت تغییر بده،
مثلاً `http://192.168.x.x:8080` (روی دستگاهِ واقعی از IP محلی استفاده کن، نه localhost).

## معماری (Clean Architecture — نسخه‌ی کاربردی)

```
src/
  core/          زیرساخت: پیکربندی، تم، HTTP، ذخیره‌سازیِ توکن، ابزار، DI
  domain/        قلبِ تجاری: entityها، interfaceِ repositoryها، use caseها  (بدونِ وابستگی به فریم‌ورک)
  data/          پیاده‌سازیِ repositoryها: DTO، mapper، فراخوانیِ API
  presentation/  رابطِ کاربری: provider، hookها (ویومدل)، کامپوننت‌ها، صفحات
  app/           مسیریابی (expo-router) — لفافه‌های نازک که صفحات را رندر می‌کنند
```

**جهتِ وابستگی:** `app → presentation → domain` و `data → domain`.
لایه‌ی presentation هرگز مستقیم به data وصل نمی‌شود؛ همه‌چیز از طریقِ use caseها و
کانتینرِ DI (`core/di`) تزریق می‌شود.

- **entityها** با camelCase‌اند و مستقل از فرمتِ API؛ **mapperها** (در `data/mappers`)
  پاسخِ snake_caseِ سرور را به entity تبدیل می‌کنند.
- **use caseها** توابعِ کارخانه‌ای‌اند (`makeX(repo) => (...) => result`) — کوچک و قابلِ تست.
- **TokenStorage** روی نیتیو از SecureStore و روی وب از localStorage استفاده می‌کند.
- کارتِ سواایپ با `Animated + PanResponder`ِ داخلیِ RN ساخته شده تا روی وب/PWA هم بی‌دردسر کار کند.

## صفحات

ورود (OTP) · تکمیلِ پروفایل · کاوش (سواایپ) · تصادفی · پسندها · گفتگو · گفتگوی تکی · پروفایل · تعلیق

## نکته
- هویتِ بصری (تمِ تیره‌ی لوکس، طلایی `#DAB877`، فونتِ Vazirmatn، RTL، ارقامِ فارسی) عیناً حفظ شده است.
- آیکون/اسپلش فعلاً پیش‌فرضِ اسکفولدند؛ با برندِ نودوست جایگزین کن (پوشه‌ی `assets/images`).
