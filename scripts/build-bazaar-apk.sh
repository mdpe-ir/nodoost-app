#!/usr/bin/env bash
#
# build-bazaar-apk.sh — build a signed production APK for Cafe Bazaar.
#
# What it does:
#   1. Sets production env vars (real API, distribution=bazaar, Bazaar RSA key).
#   2. Verifies the release keystore is present and is the *correct* key.
#   3. Regenerates android/ via `expo prebuild` (plugins inject signing + bazaar).
#   4. Builds a signed release APK with Gradle and copies it into build-output/.
#
# Requirements: JDK 21, Android SDK, and a local SOCKS5 proxy (plugins.gradle.org
# is blocked here). Everything is overridable through environment variables.
#
# Usage:  bash scripts/build-bazaar-apk.sh
set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# ── Toolchain ─────────────────────────────────────────────────────────────
# The system default JDK (26) breaks Gradle; RN 0.85 works with 21.
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# ── Production config (baked into the JS bundle at build time) ─────────────
# The real backend (from the PWA Dockerfile; the "bakcend" typo is intentional).
export EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://nodoost-bakcend.darkube.ir}"
export EXPO_PUBLIC_DISTRIBUTION="bazaar"
# Bazaar RSA key — source of truth is app.json → extra.bazaarRsaKey (do not duplicate).
export EXPO_PUBLIC_BAZAAR_RSA_KEY="$(node -p "require('./app.json').expo.extra.bazaarRsaKey")"
# Ignore the local .env (localhost) so the production URL is deterministic.
export EXPO_NO_DOTENV=1

# ── Gradle networking: go through the user's local SOCKS5 proxy ────────────
SOCKS_HOST="${SOCKS_HOST-127.0.0.1}"
SOCKS_PORT="${SOCKS_PORT-2080}"
SOCKS_ARGS=()
if [[ -n "$SOCKS_HOST" ]]; then
  SOCKS_ARGS=(-DsocksProxyHost="$SOCKS_HOST" -DsocksProxyPort="$SOCKS_PORT")
fi
# If every dependency is already cached, build without network via GRADLE_OFFLINE=1.
GRADLE_EXTRA=()
if [[ -n "${GRADLE_OFFLINE:-}" ]]; then
  GRADLE_EXTRA+=(--offline)
  SOCKS_ARGS=()
fi

# ── ABIs for real Bazaar devices (not emulator x86) ────────────────────────
ABIS="${ABIS:-arm64-v8a,armeabi-v7a}"

# ── Release keystore ──────────────────────────────────────────────────────
# Bazaar locks an app forever to the key of its *first release*. For com.nodoost.app
# that key is the Shoplon keystore (alias=upload). Signing with any other key makes
# Bazaar reject the upload:
#   "The package must be signed with the same key as the last published package."
#
# ⚠ This script *deliberately* no longer creates a keystore. Auto-generating one
#   previously caused releases to be signed with the wrong key (nodoost-release.jks)
#   and broke publishing. If the keystore is missing, the build stops with an error
#   instead of silently minting a useless new key.
KEYSTORE_DIR="$APP_DIR/keystore"
KEYSTORE_ENV="$KEYSTORE_DIR/release-keystore.env"

if [[ ! -f "$KEYSTORE_ENV" ]]; then
  cat >&2 <<EOF

✗ Keystore credentials file not found:
    $KEYSTORE_ENV

  This file (together with the .jks) is secret and not in git. Restore it from a secure backup.
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

✗ Release keystore not found:
    $KEYSTORE_FILE

  Without this file com.nodoost.app cannot be updated on Bazaar.
  Restore it from a secure backup. (This script deliberately does not create a new
  keystore — a new key means the Bazaar upload gets rejected.)
EOF
  exit 1
fi

# ── Fingerprint gate: confirm the key is the one Bazaar expects, before building ──
ACTUAL_SHA1="$("$JAVA_HOME/bin/keytool" -list -v \
  -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" -storepass "$STORE_PASSWORD" 2>/dev/null \
  | grep -i 'SHA1:' | head -1 | sed 's/.*SHA1: *//' | tr -d ' \r')"

if [[ -z "$ACTUAL_SHA1" ]]; then
  echo "✗ Could not read the keystore — wrong password or alias ($KEY_ALIAS)." >&2
  exit 1
fi
if [[ "${ACTUAL_SHA1^^}" != "${EXPECTED_SHA1^^}" ]]; then
  cat >&2 <<EOF

✗ Wrong keystore! Bazaar will reject this package.
    expected : $EXPECTED_SHA1
    actual   : $ACTUAL_SHA1
    file     : $KEYSTORE_FILE
EOF
  exit 1
fi
echo "==> Keystore verified (SHA-1: $ACTUAL_SHA1, alias: $KEY_ALIAS)"

# ── versionCode gate: must be higher than the version published on Bazaar ──
VERSION_CODE="$(node -p "require('./app.json').expo.android.versionCode" 2>/dev/null || echo 0)"
PUBLISHED_VERSION_CODE="${PUBLISHED_VERSION_CODE:-12}"
if (( VERSION_CODE <= PUBLISHED_VERSION_CODE )); then
  cat >&2 <<EOF

✗ versionCode is $VERSION_CODE, but the version published on Bazaar has
  versionCode=$PUBLISHED_VERSION_CODE. Bazaar only accepts a higher versionCode.

  In app.json set expo.android.versionCode to $((PUBLISHED_VERSION_CODE + 1))
  or higher (and bump expo.version too).
EOF
  exit 1
fi

# ── prebuild: regenerate android/ with plugins (signing + bazaar + Poolakey patch) ─
echo "==> expo prebuild -p android --clean …"
npx expo prebuild -p android --clean

# Expo's default Gradle metaspace is 512m, which is not enough for a release build
# (Lint/Proguard/two ABIs) and causes a Metaspace OOM. Override it after prebuild
# (last key wins). Since prebuild --clean regenerates gradle.properties every time,
# it has to be appended again here.
printf '\n# override by build-bazaar-apk.sh — release build needs more metaspace\norg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8\n' >> android/gradle.properties
# HTTP timeouts so a flaky network/proxy fails the build fast instead of hanging for hours.
printf '\n# fail fast on flaky network instead of hanging\nsystemProp.org.gradle.internal.http.connectionTimeout=30000\nsystemProp.org.gradle.internal.http.socketTimeout=60000\n' >> android/gradle.properties

# ── build: signed release APK ─────────────────────────────────────────────
# lint/lintVitalRelease are skipped (heavy and a source of OOM; the debug build used -x lint too).
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

# ── Collect output (one APK per architecture when ABI splits are on) ───────
RELEASE_DIR="$APP_DIR/android/app/build/outputs/apk/release"
OUT_DIR="$APP_DIR/build-output"
mkdir -p "$OUT_DIR"
VER="$(node -p "require('./app.json').expo.version")"

# A single pattern that matches both the split output (app-arm64-v8a-release.apk)
# and the universal output (app-release.apk). Note: nullglob only affects *patterns*,
# not fixed names — so both cases must live inside one glob.
shopt -s nullglob
BUILT_APKS=("$RELEASE_DIR"/app*release.apk)
shopt -u nullglob
if (( ${#BUILT_APKS[@]} == 0 )); then
  echo "Error: no APK was built in $RELEASE_DIR" >&2
  exit 1
fi

APKSIGNER="$(ls "$ANDROID_HOME"/build-tools/*/apksigner 2>/dev/null | sort -V | tail -1 || true)"
AAPT2="$(ls "$ANDROID_HOME"/build-tools/*/aapt2 2>/dev/null | sort -V | tail -1 || true)"
EXPECTED_PLAIN="$(echo "$EXPECTED_SHA1" | tr -d ':' | tr '[:upper:]' '[:lower:]')"

DEST_LIST=()
for APK in "${BUILT_APKS[@]}"; do
  # Universal APK (single file containing both architectures) → simple name.
  # If ABI splits are ever enabled, the architecture is added to the file name.
  BASE="$(basename "$APK")"
  if [[ "$BASE" == "app-release.apk" ]]; then
    DEST="$OUT_DIR/nodoost-${VER}-bazaar-release.apk"
  else
    ABI="$(echo "$BASE" | sed -E 's/^app-(.*)-release\.apk$/\1/')"
    DEST="$OUT_DIR/nodoost-${VER}-${ABI}-bazaar-release.apk"
  fi
  cp "$APK" "$DEST"

  # ── Hard signature gate: if Gradle fell back to the debug key, it is caught here ──
  if [[ -n "$APKSIGNER" ]]; then
    APK_SHA1="$("$APKSIGNER" verify --print-certs "$DEST" 2>/dev/null \
      | grep -i 'certificate SHA-1 digest' | head -1 | sed 's/.*digest: *//' | tr -d ' \r')"
    if [[ "${APK_SHA1,,}" != "$EXPECTED_PLAIN" ]]; then
      cat >&2 <<EOF

✗ APK signed with the wrong key — Bazaar will reject it. Do not upload!
    file     : $BASE
    expected : $EXPECTED_PLAIN
    actual   : ${APK_SHA1:-<no signature found>}
EOF
      rm -f "$DEST"
      exit 1
    fi
  fi
  DEST_LIST+=("$DEST")
done

echo ""
echo "✅ Signed production output is ready (signature verified against the Bazaar key):"
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
  echo "Upload all ${#DEST_LIST[@]} files in a *single release* (the \"add package\" option);"
  echo "Bazaar itself serves the compatible package to each device."
else
  echo "Upload this file in the Bazaar developer panel for com.nodoost.app."
  echo "(Universal APK — includes both arm64-v8a and armeabi-v7a.)"
fi
echo ""
echo "Next: upload this APK in the Bazaar developer panel for com.nodoost.app."
echo "For every subsequent upload, bump version and android.versionCode in app.json."
