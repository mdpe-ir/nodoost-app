#!/usr/bin/env bash
# ساخت و ارسال ایمیجِ PWA اپ (React Native Web + nginx) به رجیستریِ هم‌روش (Darkube).
# اگر docker از قبل login باشد نیازی به متغیرهای HAMDOCKER_USERNAME/PASSWORD نیست.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="${HAMDOCKER_REGISTRY:-registry.hamdocker.ir}"
NAMESPACE="${HAMDOCKER_NAMESPACE:-spelladss}"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
# آدرسِ API در زمانِ build درون‌ریزی می‌شود (روی وب متغیرِ محیطیِ زمانِ اجرا وجود ندارد).
API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://nodoost-bakcend.darkube.ir}"
IMAGE="$REGISTRY/$NAMESPACE/nodoost-app"

if [[ -n "${HAMDOCKER_USERNAME:-}" && -n "${HAMDOCKER_PASSWORD:-}" ]]; then
  echo "$HAMDOCKER_PASSWORD" | docker login "$REGISTRY" --username "$HAMDOCKER_USERNAME" --password-stdin
fi

echo "==> Building $IMAGE:$VERSION (API=$API_BASE_URL)"
docker build \
  --build-arg "EXPO_PUBLIC_API_BASE_URL=$API_BASE_URL" \
  -t "$IMAGE:$VERSION" -t "$IMAGE:latest" "$ROOT_DIR"

echo "==> Pushing $IMAGE:$VERSION"
docker push "$IMAGE:$VERSION"
docker push "$IMAGE:latest"

echo
echo "Push complete: $IMAGE:$VERSION (+ latest)"
