#!/usr/bin/env bash
# Runs the REAL backend (src/index.ts, unmodified copy of a commit) on 127.0.0.1:3911 with a fresh scratch SQLite,
# the given web export as public/, synthetic secrets, dev OTP, and all outbound traffic blocked.
# Usage: run-local.sh <commit> <web-export-dir> <run-dir>
set -euo pipefail
COMMIT=$1; WEB=$2; RUN=$3
REPO="/c/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart"
SP="$(cd "$(dirname "$0")" && pwd)"
if [ -e "$RUN/backend/node_modules" ]; then powershell.exe -NoProfile -Command "[IO.Directory]::Delete('$(cygpath -w "$RUN/backend/node_modules")')"; fi
rm -rf "$RUN"; mkdir -p "$RUN/backend" "$RUN/data"
git -C "$REPO/.pdf-requirements-verify" archive "$COMMIT" backend/src backend/package.json backend/tsconfig.json | tar -x -C "$RUN"
cp -a "$WEB/." "$RUN/backend/public/" 2>/dev/null || { mkdir -p "$RUN/backend/public"; cp -a "$WEB/." "$RUN/backend/public/"; }
powershell.exe -NoProfile -Command "New-Item -ItemType Junction -Path \"$(cygpath -w "$RUN/backend/node_modules")\" -Target \"$(cygpath -w "$REPO/.hotfix-admin-ops/backend/node_modules")\" | Out-Null"
for v in $(env | cut -d= -f1 | grep -E '^(DATABASE_URL|POSTGRES_URL|.*_DATABASE_URL|MSG91_.*|VIMOPAY_.*|REVIEW_ACCOUNT_.*|PAYMENTS_ENABLED|VIBECODE_.*|EXPO_PUBLIC_MSG91.*)$'); do unset "$v"; done
export PORT=3911 NODE_ENV=test BACKEND_URL=http://127.0.0.1:3911 PUBLIC_BACKEND_URL=http://127.0.0.1:3911
export LEADS_DB="$RUN/data/local.sqlite" TXN_DB="$RUN/data/local.sqlite" USER_DB="$RUN/data/local.sqlite"
export AUTH_TOKEN_SECRET="local-customer-$RANDOM$RANDOM$RANDOM" HOME_LOAN_ADMIN_TOKEN_SECRET="local-admin-$RANDOM$RANDOM$RANDOM"
export ADMIN_EMAIL=admin@example.test HOME_LOAN_ADMIN_PASSWORD="local-admin-$RANDOM$RANDOM$RANDOM" ALLOW_DEV_OTP=true
export HTTP_PROXY=http://127.0.0.1:9 HTTPS_PROXY=http://127.0.0.1:9 NO_PROXY=127.0.0.1,localhost OUTBOUND_LOG="$RUN/outbound-blocked.log"
: > "$OUTBOUND_LOG"
echo "$AUTH_TOKEN_SECRET" > "$RUN/customer-secret.txt"; echo "$HOME_LOAN_ADMIN_PASSWORD" > "$RUN/admin-password.txt"
cd "$RUN/backend"
exec "$REPO/.build-tools/bun-runtime/bun-windows-x64/bun.exe" --preload "$(cygpath -w "$SP/block-outbound.ts")" src/index.ts
