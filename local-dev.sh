#!/usr/bin/env bash
# Local development setup for Paisa Mart Mobile
# Usage: ./local-dev.sh

set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "$0")/mobile" && pwd)"
BRANCH="main"

echo "==> Pulling latest ($BRANCH)"
git pull origin "$BRANCH"

echo "==> Installing mobile dependencies"
cd "$MOBILE_DIR"
npm install --legacy-peer-deps

echo "==> Starting Expo development server"
echo ""
echo "✓ Server starting..."
echo "  Web:     http://localhost:8081"
echo "  QR Code: Scan to open on mobile"
echo ""
echo "Press 'w' to open web preview"
echo "Press 'a' to open Android"
echo "Press 's' to switch to Expo Go"
echo ""

npm start
