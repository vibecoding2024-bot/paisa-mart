#!/usr/bin/env bash
# Paisa Mart — one-command redeploy on the EC2 host.
# Usage:  ~/paisa-mart-new/deploy.sh
set -euo pipefail

BUN="$HOME/.bun/bin/bun"          # bun is NOT on PATH — use full path
REPO="$HOME/paisa-mart-new"
APP_DIR="$REPO/backend"
MOBILE_DIR="$REPO/mobile"
PUBLIC_DIR="$APP_DIR/public"
PM2_NAME="paisa-mart"
BRANCH="main"

echo "==> Pulling latest ($BRANCH)"
git -C "$REPO" pull origin "$BRANCH"

echo "==> Building web app"
cd "$MOBILE_DIR"
"$BUN" install --frozen-lockfile
EXPO_PUBLIC_API_URL="https://paisa-mart.com" "$BUN" run build:web

echo "==> Publishing web app"
rm -rf "$PUBLIC_DIR"
cp -R "$MOBILE_DIR/dist" "$PUBLIC_DIR"

echo "==> Installing backend dependencies"
cd "$APP_DIR"
"$BUN" install

echo "==> Restarting app via pm2"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  PORT=3000 pm2 start "$BUN" --name "$PM2_NAME" --cwd "$APP_DIR" -- run src/index.ts
fi
pm2 save

echo "==> Health check"
sleep 3
curl -fsS -m 5 http://localhost:3000/health && echo
curl -fsS -m 5 -o /dev/null -w "root via nginx :80 -> HTTP %{http_code}\n" http://localhost/ || true

echo "==> Done. pm2 status:"
pm2 list
