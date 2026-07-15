#!/usr/bin/env bash
#
# build-bazaar-apk.sh — ساختِ APKِ امضاشده‌ی production برای کافه‌بازار.
#
# چه‌کاری می‌کند:
#   1. متغیرهای production را ست می‌کند (API واقعی، توزیع=bazaar، کلیدِ RSAِ بازار).
#   2. یک‌بار کی‌استورِ release می‌سازد و بعد همیشه همان را استفاده می‌کند.
#   3. android/ را با `expo prebuild` بازتولید می‌کند (پلاگین‌ها امضا و بازار را تزریق می‌کنند).
#   4. با Gradle یک APKِ release امضاشده می‌سازد و در build-output/ کپی می‌کند.
#
# پیش‌نیازها: JDK 21، Android SDK، و یک پروکسیِ SOCKS5 محلی (چون plugins.gradle.org
# فیلتر است). همه از طریقِ متغیرهای محیطی قابلِ override هستند.
#
# استفاده:  bash scripts/build-bazaar-apk.sh
set -euo pipefail

# ── مسیرها ────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# ── زنجیره‌ی ابزار ─────────────────────────────────────────────────────────
# JDKِ پیش‌فرضِ سیستم (۲۶) Gradle را می‌شکند؛ RN 0.85 با ۲۱ کار می‌کند.
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# ── پیکربندیِ production (در زمانِ build درونِ باندلِ JS جاسازی می‌شود) ──────
# بک‌اندِ واقعی (از Dockerfileِ نسخه‌ی PWA؛ املای «bakcend» عمداً همان است).
export EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://nodoost-bakcend.darkube.ir}"
export EXPO_PUBLIC_DISTRIBUTION="bazaar"
# کلیدِ RSAِ بازار — منبعِ حقیقت app.json → extra.bazaarRsaKey است (تکرار نکن).
export EXPO_PUBLIC_BAZAAR_RSA_KEY="$(node -p "require('./app.json').expo.extra.bazaarRsaKey")"
# .env محلی (localhost) را نادیده بگیر تا آدرسِ production قطعی باشد.
export EXPO_NO_DOTENV=1

# ── شبکه‌ی Gradle: عبور از پروکسیِ SOCKS5 محلیِ کاربر ──────────────────────
SOCKS_HOST="${SOCKS_HOST-127.0.0.1}"
SOCKS_PORT="${SOCKS_PORT-2080}"
SOCKS_ARGS=()
if [[ -n "$SOCKS_HOST" ]]; then
  SOCKS_ARGS=(-DsocksProxyHost="$SOCKS_HOST" -DsocksProxyPort="$SOCKS_PORT")
fi
# اگر همه‌ی dependencyها cache شده‌اند، با GRADLE_OFFLINE=1 بدونِ شبکه build کن.
GRADLE_EXTRA=()
if [[ -n "${GRADLE_OFFLINE:-}" ]]; then
  GRADLE_EXTRA+=(--offline)
  SOCKS_ARGS=()
fi

# ── ABIهای دستگاه‌های واقعیِ بازار (نه x86 امولاتور) ───────────────────────
ABIS="${ABIS:-arm64-v8a,armeabi-v7a}"

# ── کی‌استورِ release (یک‌بار بساز، همیشه همان را نگه‌دار) ──────────────────
KEYSTORE_DIR="$APP_DIR/keystore"
KEYSTORE_FILE="${NODOOST_KEYSTORE_FILE:-$KEYSTORE_DIR/nodoost-release.jks}"
KEYSTORE_ENV="$KEYSTORE_DIR/release-keystore.env"
KEY_ALIAS="${NODOOST_KEY_ALIAS:-nodoost}"
mkdir -p "$KEYSTORE_DIR"

# اگر رمزها از قبل ذخیره شده‌اند، بارگذاری کن.
if [[ -f "$KEYSTORE_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$KEYSTORE_ENV"
fi

if [[ ! -f "$KEYSTORE_FILE" ]]; then
  echo "==> کی‌استورِ release پیدا نشد — یک‌بار ساخته می‌شود…"
  STORE_PASSWORD="${STORE_PASSWORD:-$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 28)}"
  KEY_PASSWORD="${KEY_PASSWORD:-$STORE_PASSWORD}"
  "$JAVA_HOME/bin/keytool" -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASSWORD" -keypass "$KEY_PASSWORD" \
    -dname "CN=Nodoost, OU=Mobile, O=SpellAds, L=Tehran, C=IR"
  umask 077
  cat > "$KEYSTORE_ENV" <<EOF
# رمزهای کی‌استورِ release نودوست — محرمانه. همراهِ فایلِ .jks بکاپ بگیر.
# با گم‌شدنِ این‌ها، دیگر هرگز نمی‌توانی com.nodoost.app را در بازار به‌روزرسانی کنی.
STORE_PASSWORD='$STORE_PASSWORD'
KEY_PASSWORD='$KEY_PASSWORD'
EOF
  chmod 600 "$KEYSTORE_ENV"
  echo ""
  echo "  ############################################################"
  echo "  #  ⚠  از این دو فایل حتماً بکاپِ امن بگیر:"
  echo "  #     $KEYSTORE_FILE"
  echo "  #     $KEYSTORE_ENV"
  echo "  #  بدونِ آن‌ها به‌روزرسانیِ اپ در بازار غیرممکن می‌شود."
  echo "  ############################################################"
  echo ""
fi

# ── prebuild: بازتولیدِ android/ با پلاگین‌ها (امضا + بازار + Poolakey patch) ─
echo "==> expo prebuild -p android --clean …"
npx expo prebuild -p android --clean

# Gradleِ پیش‌فرضِ Expo متاسپیس ۵۱۲m دارد که برای buildِ release (Lint/Proguard/دو ABI)
# کم است و OOMِ Metaspace می‌دهد. بعد از prebuild override کن (کلیدِ آخر برنده است).
# چون prebuild --clean هر بار gradle.properties را از نو می‌سازد، اینجا دوباره اضافه می‌شود.
printf '\n# override by build-bazaar-apk.sh — release build needs more metaspace\norg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8\n' >> android/gradle.properties
# تایم‌اوتِ HTTP تا اگر شبکه/پروکسی لنگ زد، build سریع fail شود نه اینکه ساعت‌ها هنگ کند.
printf '\n# fail fast on flaky network instead of hanging\nsystemProp.org.gradle.internal.http.connectionTimeout=30000\nsystemProp.org.gradle.internal.http.socketTimeout=60000\n' >> android/gradle.properties

# ── build: APKِ release امضاشده ────────────────────────────────────────────
# lint/lintVitalRelease حذف می‌شوند (سنگین و منبعِ OOM؛ نسخه‌ی debug هم -x lint داشت).
echo "==> gradle assembleRelease  (ABIs: $ABIS,  API: $EXPO_PUBLIC_API_BASE_URL) …"
( cd android && ./gradlew :app:assembleRelease \
    -x lint -x lintVitalRelease -x test \
    -PreactNativeArchitectures="$ABIS" \
    -PNODOOST_RELEASE_STORE_FILE="$KEYSTORE_FILE" \
    -PNODOOST_RELEASE_STORE_PASSWORD="$STORE_PASSWORD" \
    -PNODOOST_RELEASE_KEY_ALIAS="$KEY_ALIAS" \
    -PNODOOST_RELEASE_KEY_PASSWORD="$KEY_PASSWORD" \
    "${SOCKS_ARGS[@]}" "${GRADLE_EXTRA[@]}" \
    --console=plain )

# ── جمع‌آوریِ خروجی ────────────────────────────────────────────────────────
APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
[[ -f "$APK" ]] || { echo "خطا: APK ساخته نشد در $APK" >&2; exit 1; }

OUT_DIR="$APP_DIR/build-output"
mkdir -p "$OUT_DIR"
VER="$(node -p "require('./app.json').expo.version")"
DEST="$OUT_DIR/nodoost-${VER}-bazaar-release.apk"
cp "$APK" "$DEST"

echo ""
echo "✅ APKِ امضاشده‌ی production آماده است:"
echo "   $DEST"
# تأییدِ امضا (نباید androiddebugkey باشد).
APKSIGNER="$(ls "$ANDROID_HOME"/build-tools/*/apksigner 2>/dev/null | sort -V | tail -1 || true)"
if [[ -n "$APKSIGNER" ]]; then
  echo "── امضاکننده ──"
  "$APKSIGNER" verify --print-certs "$DEST" 2>/dev/null | grep -iE "signer #1 (subject|certificate SHA-256)" || true
fi
echo ""
echo "بعدی: این APK را در پنلِ توسعه‌دهنده‌ی بازار برای com.nodoost.app بارگذاری کن."
echo "برای هر آپلودِ بعدی، version و android.versionCode را در app.json بالا ببر."
