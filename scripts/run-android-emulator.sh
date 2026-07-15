#!/usr/bin/env bash
#
# run-android-emulator.sh — اجرای نسخه‌ی dev روی امولاتورِ اندروید.
#
# چه‌کاری می‌کند:
#   1. زنجیره‌ی ابزار را ست می‌کند (JDK 21 + Android SDK) — مثلِ build-bazaar-apk.sh.
#   2. اگر هیچ دستگاهی متصل نباشد، یک AVD را بالا می‌آورد و منتظرِ boot می‌ماند.
#   3. آدرسِ API را برای امولاتور اصلاح می‌کند (localhost → 10.0.2.2).
#   4. با `expo run:android` بیلدِ debug را نصب و Metro را اجرا می‌کند.
#
# نکته: برخلافِ APKِ بازار این‌جا نسخه‌ی debug ساخته می‌شود؛ توزیع روی «bazaar» ست
# نمی‌شود مگر با EXPO_PUBLIC_DISTRIBUTION=bazaar (پرداختِ Poolakey فقط با APKِ نصب‌شده
# از خودِ بازار کار می‌کند، پس روی امولاتور معمولاً وبی/غیرفعال است).
#
# استفاده:
#   bash scripts/run-android-emulator.sh              # اولین AVD موجود
#   bash scripts/run-android-emulator.sh Pixel_8      # یک AVD مشخص
#   AVD=Pixel_8 bash scripts/run-android-emulator.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# ── زنجیره‌ی ابزار ─────────────────────────────────────────────────────────
# JDKِ پیش‌فرضِ سیستم (۲۶) Gradle را می‌شکند؛ RN 0.85 با ۲۱ کار می‌کند.
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"

for bin in "$ADB" "$EMULATOR"; do
  [[ -x "$bin" ]] || { echo "خطا: پیدا نشد: $bin" >&2; exit 1; }
done

# ── انتخابِ AVD ────────────────────────────────────────────────────────────
AVD_NAME="${1:-${AVD:-}}"
if [[ -z "$AVD_NAME" ]]; then
  AVD_NAME="$("$EMULATOR" -list-avds | head -1 || true)"
fi
if [[ -z "$AVD_NAME" ]]; then
  echo "خطا: هیچ AVDای وجود ندارد. یکی را در Android Studio (Device Manager) بساز." >&2
  exit 1
fi

# ── بالا آوردنِ امولاتور (اگر دستگاهی متصل نیست) ────────────────────────────
if "$ADB" devices | grep -qw "device"; then
  echo "==> یک دستگاه/امولاتور از قبل متصل است — همان استفاده می‌شود."
else
  echo "==> اجرای امولاتور: $AVD_NAME …"
  # bootِ سریع‌تر و بی‌صدا؛ لاگ در پس‌زمینه دور ریخته می‌شود.
  nohup "$EMULATOR" -avd "$AVD_NAME" -netdelay none -netspeed full >/dev/null 2>&1 &

  echo "==> منتظرِ بالا آمدنِ دستگاه …"
  "$ADB" wait-for-device
  # صبر تا کاملِ boot (sys.boot_completed=1)
  until [[ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
    sleep 2
  done
  echo "==> امولاتور بالا آمد."
fi

# ── آدرسِ API برای امولاتور ────────────────────────────────────────────────
# داخلِ امولاتور، localhostِ خودِ دستگاه است؛ هاست از 10.0.2.2 در دسترس است.
if [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  # از .env بخوان (اگر باشد) و localhost را ترجمه کن.
  ENV_URL="$(grep -E '^EXPO_PUBLIC_API_BASE_URL=' .env 2>/dev/null | tail -1 | cut -d= -f2- || true)"
  EXPO_PUBLIC_API_BASE_URL="${ENV_URL:-http://localhost:8080}"
fi
EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL//localhost/10.0.2.2}"
EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL//127.0.0.1/10.0.2.2}"
export EXPO_PUBLIC_API_BASE_URL
# .env دوباره localhost را تحمیل نکند.
export EXPO_NO_DOTENV=1

# پورتِ بک‌اند را هم به دستگاه reverse کن تا اگر جایی localhost ماند باز کار کند.
API_PORT="$(printf '%s' "$EXPO_PUBLIC_API_BASE_URL" | sed -nE 's#.*:([0-9]+).*#\1#p')"
if [[ -n "$API_PORT" ]]; then
  "$ADB" reverse "tcp:$API_PORT" "tcp:$API_PORT" >/dev/null 2>&1 || true
fi

echo "==> نصب و اجرای نسخه‌ی debug  (API=$EXPO_PUBLIC_API_BASE_URL)"
echo "    (بارِ اول Gradle کمی طول می‌کشد؛ Metro بعدش بالا می‌آید.)"
npx expo run:android --device "$("$ADB" devices | awk '/device$/{print $1; exit}')"
