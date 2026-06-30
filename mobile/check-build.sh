#!/bin/bash

echo "🔍 Checking Paisa Mart APK Build Progress..."
echo ""

# Check if Gradle daemon is running
if ps aux | grep -v grep | grep "gradle.*assembleRelease" > /dev/null; then
  echo "✅ Build is currently running"
else
  echo "⚠️  No active build detected"
fi

# Check Gradle daemon status
echo ""
echo "Gradle Daemon Status:"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
cd /Users/nikithgoudpalle/paisa-mart/mobile/android && ./gradlew --status 2>/dev/null | grep -E "PID|BUSY|IDLE"

# Check build directory
echo ""
echo "Build Directory:"
if [ -d "/Users/nikithgoudpalle/paisa-mart/mobile/android/app/build" ]; then
  SIZE=$(du -sh /Users/nikithgoudpalle/paisa-mart/mobile/android/app/build 2>/dev/null | cut -f1)
  echo "  Size: $SIZE"
else
  echo "  Not created yet (still downloading dependencies)"
fi

# Check for APK
echo ""
echo "APK Status:"
if [ -f "/Users/nikithgoudpalle/paisa-mart/mobile/android/app/build/outputs/apk/release/app-release.apk" ]; then
  SIZE=$(ls -lh /Users/nikithgoudpalle/paisa-mart/mobile/android/app/build/outputs/apk/release/app-release.apk | awk '{print $5}')
  echo "  ✅ APK BUILT SUCCESSFULLY!"
  echo "  Location: android/app/build/outputs/apk/release/app-release.apk"
  echo "  Size: $SIZE"
else
  echo "  ⏳ APK not ready yet (still building)"
fi

# Disk space
echo ""
echo "Available Disk Space:"
df -h / | grep -E "Filesystem|/$" | awk 'NR==2{print "  "$4" available ("$5" used)"}'
