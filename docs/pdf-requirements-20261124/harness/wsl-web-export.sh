#!/usr/bin/env bash
# Local TEST web export of a commit (never production): clean clone, frozen pnpm install, Expo web export
# with EXPO_PUBLIC_TEST_ENV=1 and a loopback API URL. Usage: wsl-web-export.sh <commit> <api-url> <out-dir>
set -euo pipefail
COMMIT=$1; API=$2; OUT=$3
SRC_REPO="/mnt/c/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart"
WORK="$HOME/pm-release/pdfreq-$COMMIT"
case "$API" in http://127.0.0.1:*) ;; *) echo "refusing non-loopback API $API"; exit 2;; esac
if [ ! -d "$WORK/.git" ]; then
  git clone -q --no-checkout "$SRC_REPO" "$WORK"
  git -C "$WORK" checkout -q "$COMMIT"
fi
git -C "$WORK" log --oneline -1
mkdir -p "$WORK/node_modules"
cd "$WORK/mobile"
[ -d node_modules/expo-router ] || pnpm install --frozen-lockfile 2>&1 | tail -3
export EXPO_PUBLIC_API_URL="$API" EXPO_PUBLIC_BACKEND_URL="$API" EXPO_PUBLIC_VIBECODE_BACKEND_URL="$API" EXPO_PUBLIC_TEST_ENV=1 DARK_MODE=class CI=1
rm -rf dist
npx expo export -p web --output-dir dist 2>&1 | tail -5
grep -l "refusing to start" dist/_expo/static/js/web/*.js >/dev/null || { echo "api guard missing"; exit 3; }
grep -c "$API" dist/_expo/static/js/web/*.js
rm -rf "$OUT" && mkdir -p "$OUT" && cp -a dist/. "$OUT/"
sha256sum "$OUT/index.html"
echo EXPORT_OK
