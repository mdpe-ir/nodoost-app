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
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${NODOOST_BACKEND_URL:-https://nodoost-bakcend.darkube.ir}"
PLATFORM="${1:-android}"

if [[ -z "${NODOOST_ADMIN_KEY:-}" ]]; then
  echo "خطا: NODOOST_ADMIN_KEY تنظیم نشده (همان ADMIN_API_KEY بک‌اند)." >&2
  exit 1
fi

# runtimeVersion = مقدارِ version در app.json (سیاستِ appVersion).
RTV="$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])")"
echo "==> runtimeVersion = $RTV  (platform=$PLATFORM, backend=$BACKEND_URL)"

OUT_DIR="$(mktemp -d)"
ZIP_FILE="$(mktemp -u).zip"
trap 'rm -rf "$OUT_DIR" "$ZIP_FILE"' EXIT

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
