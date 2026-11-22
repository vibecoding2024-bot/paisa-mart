#!/usr/bin/env bash
# Local TEST build of fix/play-store-remediation-20261122 inside WSL (debug-signed, not for upload).
set -euo pipefail
BRANCH=fix/play-store-remediation-20261122
SRC_REPO="/mnt/c/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart"
BASE="$HOME/pm-play"
OPT="$BASE/opt"; SDK="$BASE/android-sdk"; WORK="$BASE/src"
mkdir -p "$OPT" "$SDK" "$BASE/dl"
step(){ echo; echo "=== $(date +%T) $*"; }

step "JDK 17"
if [ ! -x "$OPT/jdk17/bin/java" ]; then
  curl -fL -o "$BASE/dl/jdk17.tgz" "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse"
  mkdir -p "$OPT/jdk17" && tar -xzf "$BASE/dl/jdk17.tgz" -C "$OPT/jdk17" --strip-components=1
fi
export JAVA_HOME="$OPT/jdk17" PATH="$OPT/jdk17/bin:$PATH"
java -version 2>&1 | head -1

step "Android SDK"
if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
  curl -fL -o "$BASE/dl/cmdline.zip" "https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"
  rm -rf "$BASE/dl/ct" && python3 -m zipfile -e "$BASE/dl/cmdline.zip" "$BASE/dl/ct"
  mkdir -p "$SDK/cmdline-tools" && rm -rf "$SDK/cmdline-tools/latest" && mv "$BASE/dl/ct/cmdline-tools" "$SDK/cmdline-tools/latest"
  chmod +x "$SDK/cmdline-tools/latest/bin/"*
fi
export ANDROID_HOME="$SDK" ANDROID_SDK_ROOT="$SDK"
yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null || true
"$SDK/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" "cmake;3.22.1" | tail -2
chmod +x "$SDK/build-tools/36.0.0/"* "$SDK/platform-tools/"* 2>/dev/null || true

step "Source (clean clone of branch, no Windows node_modules or caches)"
rm -rf "$WORK"
git clone -q --branch "$BRANCH" --single-branch "$SRC_REPO" "$WORK"
git -C "$WORK" log --oneline -1

step "pnpm frozen install"
# Root package.json declares npm workspaces, so Expo's Metro config watches <repo>/node_modules;
# Metro aborts (ENOENT) if it is missing in a clean clone. Empty dir only: no deps installed there.
mkdir -p "$WORK/node_modules"
cd "$WORK/mobile"
pnpm install --frozen-lockfile 2>&1 | tail -3

step "expo prebuild (android)"
CI=1 npx expo prebuild --platform android --no-install --clean 2>&1 | grep -v EDGE_TO_EDGE | tail -2
grep -n "versionCode\|applicationId" android/app/build.gradle

step "API URL for this build: ${EXPO_PUBLIC_API_URL:-<default https://paisa-mart.com>}"
if [ -n "${EXPO_PUBLIC_API_URL:-}" ]; then
  # Test builds: every client base URL must point at the test backend (never production).
  export EXPO_PUBLIC_BACKEND_URL="$EXPO_PUBLIC_API_URL" EXPO_PUBLIC_VIBECODE_BACKEND_URL="$EXPO_PUBLIC_API_URL"
fi
if [ -n "${CLEARTEXT_LOCAL:-}" ]; then
  # Screenshot/test variant only: allow HTTP to the local isolated backend via adb reverse.
  sed -i 's/<application /<application android:usesCleartextTraffic="true" /' android/app/src/main/AndroidManifest.xml
fi

step "gradle assembleRelease (debug-signed test build)"
cd android
echo "sdk.dir=$SDK" > local.properties
set +e
NODE_ENV=production ./gradlew assembleRelease --no-daemon --console=plain --max-workers=8 "-Dorg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g" -PreactNativeArchitectures=x86_64,arm64-v8a > "$BASE/gradle.log" 2>&1
rc=$?
set -e
tail -25 "$BASE/gradle.log"
[ $rc -eq 0 ] || { echo "GRADLE FAILED rc=$rc (full log: $BASE/gradle.log)"; exit $rc; }
ls -la app/build/outputs/apk/release/
sha256sum app/build/outputs/apk/release/*.apk
