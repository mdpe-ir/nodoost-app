#!/usr/bin/env bash
# انتشارِ به‌روزرسانیِ OTA (expo-updates خودمیزبان) به بک‌اندِ نودوست.
#
# این اسکریپت بسته‌ی جاوااسکریپتِ اندروید را اکسپورت و به سرورِ به‌روزرسانی
# (POST /api/admin/updates/publish) آپلود می‌کند. اپ‌هایی که با نسخه‌ی همین
# runtimeVersion (= version در app.json) نصب شده‌اند، در اجرای بعدی آن را
# می‌گیرند. فقط برای تغییراتِ JS/دارایی — تغییراتِ نیتیو نیاز به APKِ تازه دارند.
#
# پیش‌نیاز:  NODOOST_ADMIN_KEY (همان ADMIN_API_KEY بک‌اند) در محیط تنظیم شده باشد.
# استفاده:  NODOOST_ADMIN_KEY=... ./scripts/publish-ota.sh
#
# انتشار برای کانالِ نسخه‌ی دیگر (APKهای قدیمی‌تر که هنوز بیرون‌اند):
#   NODOOST_RUNTIME_VERSION=2.3.7 NODOOST_ADMIN_KEY=... ./scripts/publish-ota.sh
# نسخه‌ی app.json موقتاً همان مقدار می‌شود (تا expoConfig هم‌خوان باشد) و در پایان
# — موفق یا ناموفق — برمی‌گردد. فقط وقتی امن است که از زمانِ ساختِ آن APK ماژولِ
# نیتیوِ تازه‌ای اضافه نشده باشد.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${NODOOST_BACKEND_URL:-https://nodoost-bakcend.darkube.ir}"
BACKEND_URL="${BACKEND_URL%/}"
PLATFORM="${1:-android}"

# فایلِ .env برای توسعه localhost است؛ OTA همیشه با بک‌اندِ production صادر می‌شود.
export EXPO_PUBLIC_API_BASE_URL="$BACKEND_URL"
export EXPO_NO_DOTENV=1

if [[ -z "${NODOOST_ADMIN_KEY:-}" ]]; then
  echo "خطا: NODOOST_ADMIN_KEY تنظیم نشده (همان ADMIN_API_KEY بک‌اند)." >&2
  exit 1
fi

# runtimeVersion = مقدارِ version در app.json (سیاستِ appVersion).
APP_RTV="$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])")"
RTV="${NODOOST_RUNTIME_VERSION:-$APP_RTV}"
echo "==> runtimeVersion = $RTV  (platform=$PLATFORM)"
echo "==> API / OTA server = $BACKEND_URL"

OUT_DIR="$(mktemp -d)"
ZIP_FILE="$(mktemp -u).zip"

# اگر برای کانالِ دیگری منتشر می‌کنیم، version را موقتاً عوض کن و در پایان برگردان.
APP_JSON_BAK=""
if [[ "$RTV" != "$APP_RTV" ]]; then
  APP_JSON_BAK="$(mktemp)"
  cp app.json "$APP_JSON_BAK"
  python3 - "$RTV" <<'PY'
import json, sys
with open('app.json') as f:
    d = json.load(f)
d['expo']['version'] = sys.argv[1]
with open('app.json', 'w') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
    f.write('\n')
PY
  echo "==> app.json version موقتاً $RTV شد (اصلی: $APP_RTV)"
fi

cleanup() {
  rm -rf "$OUT_DIR" "$ZIP_FILE"
  if [[ -n "$APP_JSON_BAK" ]]; then
    mv "$APP_JSON_BAK" app.json
    echo "==> app.json به نسخه‌ی $APP_RTV برگشت"
  fi
}
trap cleanup EXIT

echo "==> expo export ($PLATFORM)"
npx expo export --platform "$PLATFORM" --output-dir "$OUT_DIR" --clear

# پیکربندیِ حل‌شده را کنارِ بسته می‌گذاریم تا سرور در extra.expoClient بگذارد.
npx expo config --json > "$OUT_DIR/expoConfig.json"

echo "==> zip"
( cd "$OUT_DIR" && zip -qr "$ZIP_FILE" . )

echo "==> upload → $BACKEND_URL/api/admin/updates/publish"
HTTP_CODE="$(curl -s -o /tmp/ota-publish-resp.json -w '%{http_code}' \
  -X POST "$BACKEND_URL/api/admin/updates/publish" \
  -H "X-Admin-Key: $NODOOST_ADMIN_KEY" \
  -F "runtimeVersion=$RTV" \
  -F "bundle=@$ZIP_FILE")"

echo "HTTP $HTTP_CODE"
cat /tmp/ota-publish-resp.json 2>/dev/null || true
echo
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "انتشار ناموفق بود." >&2
  exit 1
fi
echo "✅ منتشر شد. اپ‌های نصب‌شده‌ی نسخه‌ی $RTV در اجرای بعدی به‌روز می‌شوند."
