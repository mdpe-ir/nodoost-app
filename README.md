# نودوست — اپلیکیشن (React Native + Expo)

بازنویسیِ فرانتِ نودوست با **React Native (Expo SDK 56)** و **TypeScript** و **Expo Router**.
از یک پایه‌ی کد، هم خروجیِ **اندروید** و هم **PWA / وب** گرفته می‌شود.

## ساختار

```
nodoost-app/
├─ app/                      # مسیرها (Expo Router — مسیریابیِ فایل‌محور)
│  ├─ _layout.tsx            # ریشه: فونت Vazirmatn، RTL، Providerها، Splash
│  ├─ index.tsx             # هدایت بر اساسِ وضعیتِ ورود/حساب
│  ├─ login.tsx             # ورود با کدِ یک‌بارمصرف (OTP)
│  ├─ onboarding.tsx        # تکمیلِ پروفایل
│  ├─ suspended.tsx         # حسابِ معلق / درخواستِ بازبینی
│  ├─ (tabs)/               # ۵ تب
│  │  ├─ discover.tsx       # کاوش (کارت‌های سواایپ + موقعیت)
│  │  ├─ random.tsx         # گفتگوی تصادفی
│  │  ├─ likes.tsx          # پسندها (با قفلِ تایری)
│  │  ├─ chat.tsx           # فهرستِ گفتگوها
│  │  └─ profile.tsx        # پروفایل، عکس‌ها، ارتقای عضویت
│  └─ thread/[id].tsx       # صفحه‌ی گفتگو
├─ src/
│  ├─ api/                  # client.ts (fetch + رفرشِ توکن) + nodoost.ts (endpointها)
│  ├─ context/AuthContext.tsx
│  ├─ hooks/useSocket.ts    # WebSocket برای پیام/مَچِ بلادرنگ
│  ├─ components/           # Button, SwipeCard, TierBadge, Avatar, …
│  ├─ theme/                # colors.ts, typography.ts (همان هویتِ بصری)
│  ├─ lib/                  # storage.ts (SecureStore/localStorage), faNum.ts
│  └─ types.ts
├─ assets/                  # آیکون، splash، favicon
├─ app.json                 # پیکربندیِ Expo (اندروید + وب + پلاگین‌ها)
├─ tsconfig.json            # مسیرِ @/* → ./src/*
└─ package.json
```

## راه‌اندازی

```bash
cd nodoost-app
npm install
npx expo install --fix     # هم‌ترازکردنِ نسخه‌ها با SDK نصب‌شده
npx expo start             # اجرا (با Expo Go یا dev build)
```

> اگر نسخه‌ها ناسازگار بود، می‌توانی یک پروژه‌ی تازه با `npx create-expo-app@latest` بسازی و سپس پوشه‌های `app/`، `src/`، `assets/` و فایلِ `app.json` را در آن کپی کنی.

## آدرسِ بک‌اند

به‌صورتِ پیش‌فرض روی `https://nodoost.ir` تنظیم شده. برای تغییر، فقط مقدارِ `extra.apiBaseUrl` در `app.json` را عوض کن:

```json
"extra": { "apiBaseUrl": "https://your-domain.ir" }
```

(کلاینت این مقدار را از `expo-constants` می‌خواند؛ توکن‌ها روی نیتیو در SecureStore و روی وب در localStorage ذخیره می‌شوند.)

## خروجیِ اندروید (APK/AAB)

با **EAS Build** (پیشنهادی):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview     # خروجیِ APK
```

یا اجرای محلی روی دستگاه/شبیه‌ساز (نیاز به Android Studio):

```bash
npx expo run:android
```

## خروجیِ PWA / وب

```bash
npm run export:web         # خروجیِ استاتیک در پوشه‌ی dist/
```

محتویاتِ `dist/` را روی هر هاستِ استاتیک (یا همان سرورِ Caddy) قرار بده. Expo برای وب، مانیفست و سرویس‌ورکرِ پایه‌ی PWA را تولید می‌کند (نام، رنگِ تم و پس‌زمینه از بخشِ `web` در `app.json` خوانده می‌شود).

## نکته‌ها

- طراحی **عیناً** همان هویتِ بصریِ نسخه‌ی وب است (تیره‌ی لوکس، طلایی `#DAB877`، فونت Vazirmatn، چیدمانِ RTL، ارقامِ فارسی).
- سطوحِ عضویت: نقره‌ای / طلایی / پلاتینیوم / الماس — قفل‌گذاریِ امکانات سمتِ سرور انجام می‌شود؛ این‌جا فقط نمایش/هدایت است.
- پیام‌ها با REST ارسال و خوانده می‌شوند؛ پیام/مَچِ بلادرنگ از طریقِ WebSocket دریافت می‌شود.
