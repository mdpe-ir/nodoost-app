#!/usr/bin/env bash
#
# run-android-emulator.sh — run the dev build on an Android emulator.
#
# What it does:
#   1. Sets up the toolchain (JDK 21 + Android SDK) — same as build-bazaar-apk.sh.
#   2. If no device is attached, boots an AVD and waits for it to finish booting.
#   3. Rewrites the API URL for the emulator (localhost -> 10.0.2.2).
#   4. Installs the debug build and starts Metro via `expo run:android`.
#
# Note: unlike the Bazaar APK, this builds the debug variant; distribution is not
# set to "bazaar" unless EXPO_PUBLIC_DISTRIBUTION=bazaar (Poolakey payments only
# work with an APK installed from Bazaar itself, so on an emulator payment is
# usually web/disabled).
#
# Usage:
#   bash scripts/run-android-emulator.sh              # first available AVD
#   bash scripts/run-android-emulator.sh Pixel_8      # a specific AVD
#   AVD=Pixel_8 bash scripts/run-android-emulator.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# ── Toolchain ──────────────────────────────────────────────────────────────
# The system default JDK (26) breaks Gradle; RN 0.85 works with 21.
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"

for bin in "$ADB" "$EMULATOR"; do
  [[ -x "$bin" ]] || { echo "Error: not found: $bin" >&2; exit 1; }
done

# Serial of the first attached (online) device, empty if none.
attached_serial() {
  "$ADB" devices | awk '$2=="device"{print $1; exit}'
}

# How many devices are online right now.
attached_count() {
  "$ADB" devices | awk '$2=="device"{n++} END{print n+0}'
}

# The name `expo run:android --device` expects for a serial. Expo matches the
# flag against its own device *name*, never against the adb serial:
#   * emulator-NNNN  -> the AVD name (via the emulator console)
#   * anything else  -> the `model:` field from `adb devices -l`, else "Device <serial>"
# Keep this in sync with @expo/cli src/start/platforms/android/adb.ts.
expo_device_name() {
  local serial="$1" model
  if [[ "$serial" == emulator-* ]]; then
    "$ADB" -s "$serial" emu avd name 2>/dev/null | head -1 | tr -d '\r'
    return
  fi
  model="$("$ADB" devices -l | awk -v s="$serial" '
    $1==s { for (i=2;i<=NF;i++) if ($i ~ /^model:/) { sub(/^model:/,"",$i); print $i; exit } }')"
  printf '%s' "${model:-Device $serial}"
}

# ── Boot an emulator (only if nothing is attached) ─────────────────────────
SERIAL="$(attached_serial)"
if [[ -n "$SERIAL" ]]; then
  echo "==> A device/emulator is already attached — reusing it."
else
  AVD_NAME="${1:-${AVD:-}}"
  if [[ -z "$AVD_NAME" ]]; then
    AVD_NAME="$("$EMULATOR" -list-avds | head -1 || true)"
  fi
  if [[ -z "$AVD_NAME" ]]; then
    echo "Error: no AVD exists. Create one in Android Studio (Device Manager)." >&2
    exit 1
  fi

  echo "==> Starting emulator: $AVD_NAME …"
  # Faster, quieter boot; logs are discarded in the background.
  nohup "$EMULATOR" -avd "$AVD_NAME" -netdelay none -netspeed full >/dev/null 2>&1 &

  echo "==> Waiting for the device to come up …"
  "$ADB" wait-for-device
  SERIAL="$(attached_serial)"
  # Wait for a full boot (sys.boot_completed=1)
  until [[ "$("$ADB" -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
    sleep 2
  done
  echo "==> Emulator is up."
fi

# ── API URL for the emulator ───────────────────────────────────────────────
# Inside the emulator, localhost is the device itself; the host is at 10.0.2.2.
if [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  # Read from .env (if present) and translate localhost.
  ENV_URL="$(grep -E '^EXPO_PUBLIC_API_BASE_URL=' .env 2>/dev/null | tail -1 | cut -d= -f2- || true)"
  EXPO_PUBLIC_API_BASE_URL="${ENV_URL:-http://localhost:8080}"
fi
EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL//localhost/10.0.2.2}"
EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL//127.0.0.1/10.0.2.2}"
export EXPO_PUBLIC_API_BASE_URL
# Stop .env from forcing localhost back in.
export EXPO_NO_DOTENV=1

# Also reverse the backend port onto the device so any leftover localhost works.
API_PORT="$(printf '%s' "$EXPO_PUBLIC_API_BASE_URL" | sed -nE 's#.*:([0-9]+).*#\1#p')"
if [[ -n "$API_PORT" ]]; then
  "$ADB" -s "$SERIAL" reverse "tcp:$API_PORT" "tcp:$API_PORT" >/dev/null 2>&1 || true
fi

DEVICE_NAME="$(expo_device_name "$SERIAL")"
echo "==> Installing and running the debug build  (API=$EXPO_PUBLIC_API_BASE_URL)"
echo "    Device: ${DEVICE_NAME:-$SERIAL}  ($SERIAL)"
echo "    (The first Gradle run takes a while; Metro comes up afterwards.)"

# With a single device attached, expo picks it on its own — passing --device only
# risks a name mismatch. Only disambiguate when there is more than one.
if [[ "$(attached_count)" -gt 1 && -n "$DEVICE_NAME" ]]; then
  npx expo run:android --device "$DEVICE_NAME"
else
  npx expo run:android
fi
