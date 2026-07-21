# انتشار در کافه‌بازار + به‌روزرسانیِ همیشه‌آخرین

این سند مراحلِ ساختِ APKِ اندروید برای **کافه‌بازار**، پرداختِ درون‌برنامه‌ای (Poolakey)،
و نگه‌داشتنِ کاربران روی آخرین نسخه را جمع می‌کند. نسخه‌ی وب/PWA بدونِ تغییر باقی می‌ماند.

## معماری (خلاصه)
- یک کدبیس، دو توزیع: **وب → زرین‌پال** (بدونِ تغییر) و **APKِ بازار → Poolakey**.
- انتخابِ درگاه در زمانِ اجرا از روی `EXPO_PUBLIC_DISTRIBUTION` انجام می‌شود
  ([paymentStrategy.ts](src/core/billing/paymentStrategy.ts)).
- «همیشه‌آخرین» دو لایه دارد: **OTA** (expo-updates) برای JS، و **دروازه‌ی
  به‌روزرسانیِ اجباری** ([UpdateGateProvider.tsx](src/presentation/providers/UpdateGateProvider.tsx))
  برای تغییرهای نیتیو.

---

## ۱) پیش‌نیازِ کنسولِ توسعه‌دهنده‌ی بازار
1. برنامه‌ای با پکیج `com.nodoost.app` بساز.
2. تبِ «پرداختِ درون‌برنامه‌ای»:
   - **کلیدِ RSA عمومی** را کپی کن. هم در `app.json` → `extra.bazaarRsaKey` (بررسیِ محلیِ
     Poolakey) و هم در پنلِ ادمین (اعتبارسنجیِ سمتِ سرور) استفاده می‌شود.
   - برای **هر تایر یک محصولِ درون‌برنامه‌ای** بساز که **شناسه‌ی محصول (SKU)** آن
     دقیقاً برابرِ **`code`ِ همان تایر** در دیتابیس باشد. بک‌اند در
     [`planFor`](../nodoost-backend/internal/payments/payments.go) محصول را با همین
     `code` در جدولِ `tiers` پیدا می‌کند. اگر SKU با code فرق کند، اعتبارسنجی رد می‌شود.
     > نکته: بک‌اند از اندپوینتِ `inapp` بازار اعتبارسنجی می‌کند، پس تایرها باید
     > **محصولِ درون‌برنامه‌ای** (نه Subscriptionِ بازار) باشند؛ کلاینت هم
     > `purchaseProduct` صدا می‌زند.
> **دیگر به `client_id` / `client_secret` / `refresh_token` نیازی نیست.** بک‌اند خریدها را
> با **امضای RSA** اعتبارسنجی می‌کند (`data_signature` روی `original_json` — همان مدلِ
> Google Play IAB)، پس OAuthِ Pardakht لازم نیست.

## ۲) پیکربندیِ بک‌اند — همه از پنلِ ادمین (بدونِ ری‌دیپلوی)
همهٔ تنظیماتِ بازار در جدولِ `app_settings` است و از پنلِ ادمین (منوی «کافه‌بازار»)
ویرایش می‌شود؛ مقدارهای اولیه با مهاجرتِ `0009_bazaar_settings.sql` seed شده‌اند:
```
bazaar_package_name  = com.nodoost.app
bazaar_rsa_key       = <کلیدِ عمومیِ RSA از پنلِ بازار>
android_store_url    = https://cafebazaar.ir/app/com.nodoost.app
min_android_version  = 2.2.1   # خالی = دروازهٔ به‌روزرسانیِ اجباری غیرفعال
latest_version       = 2.2.1
```
متغیرهای محیطی (`BAZAAR_PACKAGE_NAME`, `BAZAAR_RSA_KEY`, `MIN_ANDROID_VERSION`, …) فقط
**fallback** هستند اگر کلید در `app_settings` نباشد.
اندپوینت‌ها: `POST /api/payments/bazaar/verify` (امضا)، `GET /api/config`، و
`GET|PUT /api/admin/config/bazaar` (پنل).

## ۳) ساختِ APKِ بازار (محلی: prebuild + Gradle)
```bash
cd nodoost-app

# پرچمِ توزیع + کلیدِ RSA را برای این build ست کن (در JS بسته می‌شوند):
export EXPO_PUBLIC_DISTRIBUTION=bazaar
export EXPO_PUBLIC_BAZAAR_RSA_KEY="<کلیدِ RSA از پنلِ بازار>"
export EXPO_PUBLIC_API_BASE_URL="https://<api-domain>"

# ۱. تولیدِ پوشه‌ی android/ (config-pluginِ Poolakey مجوز و <queries> را تزریق می‌کند)
npx expo prebuild -p android --clean

# ۲. build نسخه‌ی release (APK یا AAB — بازار هر دو را می‌پذیرد)
cd android && ./gradlew assembleRelease      # یا bundleRelease برای AAB
# خروجی: android/app/build/outputs/apk/release/app-release.apk
```
### ⚠ کی‌استور — مهم‌ترین نکته

بازار اپ را برای همیشه به کلیدِ **اولین انتشار** قفل می‌کند. برای `com.nodoost.app`
آن کلید، کی‌استورِ **Shoplon** است:

```
فایل   : keystore/shoplon-upload-key.jks      alias: upload
مالک   : CN=M.Karimi, O=Shoplon, OU=Mobile
SHA-1  : ED:56:8B:E8:E3:39:72:BA:01:2F:FE:00:85:6D:37:AB:54:3A:8F:19
```

امضا با هر کلیدِ دیگری باعثِ این خطای بازار می‌شود:
> بسته باید با کلیدی یکسان با آخرین بسته منتشر شده امضا (Sign) شود.

- کی‌استور و رمزها در `keystore/` هستند و **در git نیستند** — بکاپِ امنِ offline بگیر.
- اسکریپتِ build **دیگر کی‌استور نمی‌سازد**. قبلاً ساختِ خودکار باعث شد نسخه‌ها با
  کلیدِ اشتباه (`nodoost-release.jks`، SHA-1 `C7:68:C9…`) امضا شوند و انتشار بشکند.
  آن فایل **بی‌مصرف** است؛ استفاده نکن.
- build قبل و بعد از ساخت، فینگرپرینت را با مقدارِ بالا تطبیق می‌دهد و در صورتِ
  اختلاف متوقف می‌شود.

### شماره‌ی نسخه
بازار فقط `versionCode` بزرگ‌تر از آخرین نسخه را می‌پذیرد. آخرین نسخه‌ی منتشرشده
`2.2.0` با `versionCode=12` است، پس هر آپلودِ بعدی باید `versionCode ≥ 13` باشد
(در `app.json` → `expo.android.versionCode`). اسکریپت این را هم چک می‌کند.

## ۴) به‌روزرسانیِ روی‌هوا (OTA)
`expo-updates` نصب و در [app.json](app.json) با `runtimeVersion.policy = appVersion`
تنظیم شده است. یک بار آدرسِ سرورِ آپدیت را وصل کن:
```bash
npx eas-cli init            # اگر پروژه‌ی EAS نداری
npx eas-cli update:configure   # updates.url و extra.eas.projectId را پر می‌کند
```
سپس هر تغییرِ JS را بدونِ APKِ جدید منتشر کن:
```bash
EXPO_PUBLIC_DISTRIBUTION=bazaar npx eas-cli update --branch production -m "توضیح"
```
- فقط JS/asset را می‌فرستد. تغییرِ نیتیو (ماژولِ جدید، ارتقای SDK) → APKِ تازه لازم است؛
  با هر APK مقدارِ `version`/`versionCode` را بالا ببر تا کانالِ OTA درست تفکیک شود.
- OTA را به رفعِ اشکال/بهبودهایی که هدفِ اصلیِ اپ را عوض نمی‌کنند محدود کن (سیاستِ فروشگاه).

## ۵) دروازه‌ی به‌روزرسانیِ اجباری
`MIN_ANDROID_VERSION` را در بک‌اند بگذار. اگر نسخه‌ی نصب‌شده کمتر باشد، اپ صفحه‌ی
مسدودکننده با دکمه‌ی «به‌روزرسانی از بازار» (دیپ‌لینکِ `bazaar://details?id=com.nodoost.app`)
نشان می‌دهد. خالی‌بودنِ متغیر = دروازه غیرفعال (fail-open).

## ۶) تستِ سرتاسری
1. APK را روی دستگاهی که **بازار نصب دارد** نصب کن.
2. خریدِ یک تایر → دیالوگِ Poolakey → کلاینت `verify` می‌زند → اشتراک فعال می‌شود
   (در پنلِ ادمین با منبعِ `bazaar` دیده می‌شود). اول با SKUِ تستیِ بازار امتحان کن.
3. وب بدونِ تغییر: `buy` هنوز زرین‌پال را باز می‌کند.
4. `MIN_ANDROID_VERSION` را بالاتر از نسخه‌ی نصب‌شده بگذار → صفحه‌ی به‌روزرسانی ظاهر شود.

## ریسکِ باز
- سازگاریِ `@cafebazaar/react-native-poolakey` (arch قدیمی، انتشارِ ۲۰۲۴) با
  Expo SDK 56 / RN 0.85 (arch جدید/bridgeless) تنها بخشِ نامطمئن است؛ در اولین
  `prebuild` + اجرای واقعی روی دستگاه تأیید شود.
