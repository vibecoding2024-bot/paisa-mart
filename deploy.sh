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
if [[ -f "$MOBILE_DIR/.env.production" ]]; then
  echo "==> Loading mobile production environment"
  set -a
  # shellcheck disable=SC1091
  source "$MOBILE_DIR/.env.production"
  set +a
fi
EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://paisa-mart.com}" "$BUN" run build:web

echo "==> Publishing web app"
rm -rf "$PUBLIC_DIR"
cp -R "$MOBILE_DIR/dist" "$PUBLIC_DIR"

echo "==> Installing backend dependencies"
cd "$APP_DIR"
"$BUN" install

if [[ -f "$APP_DIR/.env.production" ]]; then
  echo "==> Loading backend production environment"
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env.production"
  set +a
fi
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"

echo "==> Restarting app via pm2"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
if command -v lsof >/dev/null 2>&1; then
  LISTENER_PID="$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN || true)"
  if [[ -n "$LISTENER_PID" ]]; then
    echo "==> Stopping stale listener on port $PORT"
    kill $LISTENER_PID || true
    sleep 1
  fi
fi
pm2 start "$BUN" --name "$PM2_NAME" --cwd "$APP_DIR" -- run src/index.ts
pm2 save

echo "==> Health check"
sleep 3
curl -fsS -m 5 http://localhost:3000/health && echo
curl -fsS -m 5 -o /dev/null -w "root via nginx :80 -> HTTP %{http_code}\n" http://localhost/ || true

echo "==> Done. pm2 status:"
pm2 list
