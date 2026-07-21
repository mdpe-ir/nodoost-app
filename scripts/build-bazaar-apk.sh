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

# ── کی‌استورِ release ──────────────────────────────────────────────────────
# بازار اپ را برای همیشه به کلیدِ *اولین انتشار* قفل می‌کند. برای com.nodoost.app
# آن کلید، کی‌استورِ Shoplon (alias=upload) است. اگر با کلیدِ دیگری امضا کنیم،
# بازار آپلود را رد می‌کند:
#   «بسته باید با کلیدی یکسان با آخرین بسته منتشر شده امضا شود.»
#
# ⚠ این اسکریپت *عمداً* دیگر کی‌استور نمی‌سازد. تولیدِ خودکارِ کی‌استور قبلاً
#   باعث شد نسخه‌ها با کلیدِ اشتباه (nodoost-release.jks) امضا شوند و انتشار
#   بشکند. اگر کی‌استور نبود، build با خطا متوقف می‌شود — نه اینکه بی‌صدا
#   کلیدِ بی‌مصرفِ جدید بسازد.
KEYSTORE_DIR="$APP_DIR/keystore"
KEYSTORE_ENV="$KEYSTORE_DIR/release-keystore.env"

if [[ ! -f "$KEYSTORE_ENV" ]]; then
  cat >&2 <<EOF

✗ فایلِ رمزهای کی‌استور پیدا نشد:
    $KEYSTORE_ENV

  این فایل (به‌همراهِ .jks) محرمانه است و در git نیست. از بکاپِ امن بازیابی‌اش کن.
EOF
  exit 1
fi
# shellcheck disable=SC1090
source "$KEYSTORE_ENV"

KEYSTORE_FILE="$KEYSTORE_DIR/${STORE_FILE:-shoplon-upload-key.jks}"
KEY_ALIAS="${KEY_ALIAS:-upload}"
EXPECTED_SHA1="${EXPECTED_SHA1:-ED:56:8B:E8:E3:39:72:BA:01:2F:FE:00:85:6D:37:AB:54:3A:8F:19}"

if [[ ! -f "$KEYSTORE_FILE" ]]; then
  cat >&2 <<EOF

✗ کی‌استورِ انتشار پیدا نشد:
    $KEYSTORE_FILE

  بدونِ این فایل نمی‌توان com.nodoost.app را در بازار به‌روزرسانی کرد.
  از بکاپِ امن بازیابی‌اش کن. (این اسکریپت عمداً کی‌استورِ جدید نمی‌سازد —
  کلیدِ جدید یعنی آپلودِ ردشده در بازار.)
EOF
  exit 1
fi

# ── گیتِ فینگرپرینت: قبل از build مطمئن شو کلید همانی است که بازار می‌خواهد ──
ACTUAL_SHA1="$("$JAVA_HOME/bin/keytool" -list -v \
  -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" -storepass "$STORE_PASSWORD" 2>/dev/null \
  | grep -i 'SHA1:' | head -1 | sed 's/.*SHA1: *//' | tr -d ' \r')"

if [[ -z "$ACTUAL_SHA1" ]]; then
  echo "✗ کی‌استور خوانده نشد — رمز یا alias ($KEY_ALIAS) اشتباه است." >&2
  exit 1
fi
if [[ "${ACTUAL_SHA1^^}" != "${EXPECTED_SHA1^^}" ]]; then
  cat >&2 <<EOF

✗ کی‌استورِ اشتباه! بازار این بسته را رد خواهد کرد.
    انتظار : $EXPECTED_SHA1
    واقعی  : $ACTUAL_SHA1
    فایل   : $KEYSTORE_FILE
EOF
  exit 1
fi
echo "==> کی‌استور تأیید شد (SHA-1: $ACTUAL_SHA1، alias: $KEY_ALIAS)"

# ── گیتِ versionCode: باید از نسخه‌ی منتشرشده در بازار بزرگ‌تر باشد ─────────
VERSION_CODE="$(node -p "require('./app.json').expo.android.versionCode" 2>/dev/null || echo 0)"
PUBLISHED_VERSION_CODE="${PUBLISHED_VERSION_CODE:-12}"
if (( VERSION_CODE <= PUBLISHED_VERSION_CODE )); then
  cat >&2 <<EOF

✗ versionCode برابرِ $VERSION_CODE است، اما نسخه‌ی منتشرشده در بازار
  versionCode=$PUBLISHED_VERSION_CODE دارد. بازار فقط versionCodeِ بزرگ‌تر را می‌پذیرد.

  در app.json مقدارِ expo.android.versionCode را به $((PUBLISHED_VERSION_CODE + 1))
  یا بیشتر تغییر بده (و expo.version را هم بالا ببر).
EOF
  exit 1
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

# ── جمع‌آوریِ خروجی (یک APK به ازای هر معماری — ABI splits) ────────────────
RELEASE_DIR="$APP_DIR/android/app/build/outputs/apk/release"
OUT_DIR="$APP_DIR/build-output"
mkdir -p "$OUT_DIR"
VER="$(node -p "require('./app.json').expo.version")"

# یک الگو که هم خروجیِ split (app-arm64-v8a-release.apk) و هم خروجیِ
# universal (app-release.apk) را بگیرد. توجه: nullglob فقط روی *الگو* اثر دارد،
# نه روی نامِ ثابت — پس هر دو حالت باید داخلِ یک glob باشند.
shopt -s nullglob
BUILT_APKS=("$RELEASE_DIR"/app*release.apk)
shopt -u nullglob
if (( ${#BUILT_APKS[@]} == 0 )); then
  echo "خطا: هیچ APKی ساخته نشد در $RELEASE_DIR" >&2
  exit 1
fi

APKSIGNER="$(ls "$ANDROID_HOME"/build-tools/*/apksigner 2>/dev/null | sort -V | tail -1 || true)"
AAPT2="$(ls "$ANDROID_HOME"/build-tools/*/aapt2 2>/dev/null | sort -V | tail -1 || true)"
EXPECTED_PLAIN="$(echo "$EXPECTED_SHA1" | tr -d ':' | tr '[:upper:]' '[:lower:]')"

DEST_LIST=()
for APK in "${BUILT_APKS[@]}"; do
  # APKِ universal (تک‌فایل، شاملِ هر دو معماری) → نامِ ساده.
  # اگر روزی ABI split روشن شود، نامِ معماری به فایل اضافه می‌شود.
  BASE="$(basename "$APK")"
  if [[ "$BASE" == "app-release.apk" ]]; then
    DEST="$OUT_DIR/nodoost-${VER}-bazaar-release.apk"
  else
    ABI="$(echo "$BASE" | sed -E 's/^app-(.*)-release\.apk$/\1/')"
    DEST="$OUT_DIR/nodoost-${VER}-${ABI}-bazaar-release.apk"
  fi
  cp "$APK" "$DEST"

  # ── گیتِ سختِ امضا: اگر Gradle به امضای debug برگشته باشد، اینجا گیر می‌افتد ──
  if [[ -n "$APKSIGNER" ]]; then
    APK_SHA1="$("$APKSIGNER" verify --print-certs "$DEST" 2>/dev/null \
      | grep -i 'certificate SHA-1 digest' | head -1 | sed 's/.*digest: *//' | tr -d ' \r')"
    if [[ "${APK_SHA1,,}" != "$EXPECTED_PLAIN" ]]; then
      cat >&2 <<EOF

✗ APK با کلیدِ اشتباه امضا شد — بازار ردش می‌کند. آپلود نکن!
    فایل   : $BASE
    انتظار : $EXPECTED_PLAIN
    واقعی  : ${APK_SHA1:-<امضا پیدا نشد>}
EOF
      rm -f "$DEST"
      exit 1
    fi
  fi
  DEST_LIST+=("$DEST")
done

echo ""
echo "✅ خروجیِ امضاشده‌ی production آماده است (امضا با کلیدِ بازار تأیید شد):"
for DEST in "${DEST_LIST[@]}"; do
  SIZE="$(du -h "$DEST" | cut -f1)"
  VC=""
  if [[ -n "$AAPT2" ]]; then
    VC="$("$AAPT2" dump badging "$DEST" 2>/dev/null | sed -n "s/.*versionCode='\([0-9]*\)'.*/\1/p" | head -1)"
  fi
  printf "   %-52s %6s  versionCode=%s\n" "$(basename "$DEST")" "$SIZE" "${VC:-?}"
done
echo ""
if (( ${#DEST_LIST[@]} > 1 )); then
  echo "هر ${#DEST_LIST[@]} فایل را در *یک رهانش* بارگذاری کن (گزینه‌ی «افزودن بسته»)؛"
  echo "بازار خودش بستهٔ سازگارِ هر دستگاه را تحویل می‌دهد."
else
  echo "این فایل را در پنلِ توسعه‌دهنده‌ی بازار برای com.nodoost.app بارگذاری کن."
  echo "(APKِ universal — شاملِ هر دو معماریِ arm64-v8a و armeabi-v7a.)"
fi
echo ""
echo "بعدی: این APK را در پنلِ توسعه‌دهنده‌ی بازار برای com.nodoost.app بارگذاری کن."
echo "برای هر آپلودِ بعدی، version و android.versionCode را در app.json بالا ببر."
