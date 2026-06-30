#!/bin/bash

echo "🚀 Building Paisa Mart APK..."
echo ""
echo "Choose build method:"
echo "1) EAS Build (Cloud - Recommended)"
echo "2) Local Build (May have issues)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
  echo ""
  echo "Building with EAS (Cloud)..."
  echo "This requires an Expo account (free tier available)"
  echo ""
  
  # Check if logged in
  if ! eas whoami > /dev/null 2>&1; then
    echo "Please login to EAS:"
    eas login
  fi
  
  echo ""
  echo "Starting cloud build..."
  eas build --platform android --profile preview
  
elif [ "$choice" = "2" ]; then
  echo ""
  echo "Building locally with Gradle..."
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  export PATH=$JAVA_HOME/bin:$PATH
  
  cd android
  ./gradlew assembleRelease
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo "Location: android/app/build/outputs/apk/release/app-release.apk"
  else
    echo ""
    echo "❌ Build failed. Try using EAS Build instead (option 1)"
  fi
else
  echo "Invalid choice"
  exit 1
fi
