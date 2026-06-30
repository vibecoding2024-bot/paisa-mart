# Paisa Mart APK Build Guide

## Current Status

✅ **Completed:**
- Expo prebuild for Android completed successfully
- Native Android project generated in `/mobile/android/`
- EAS CLI installed globally
- Java 17 installed and configured
- Root `package.json` created with monorepo structure
- `eas.json` configured with APK build profiles

❌ **Current Challenges:**
- Local disk space limitations preventing gradle build completion
- npm dependency installation failing during build process
- Android SDK needs full installation

## Build Methods

### Method 1: EAS Build (Recommended - Cloud-Based)

**Best for:** Production builds without local setup

**Requirements:**
- Expo account (free tier available)
- EAS CLI (already installed)

**Steps:**
```bash
cd /Users/nikithgoudpalle/paisa-mart/mobile

# Login to Expo/EAS
eas login

# Build APK in the cloud
eas build --platform android --profile production

# Or build preview version
eas build --platform android --profile preview
```

**Advantages:**
- No local SDK setup needed
- Consistent builds
- Automatic code signing available
- Free tier available

### Method 2: Local Build with Full Setup

**Best for:** CI/CD pipelines, offline builds

**Prerequisites:**
1. **Java 17** (Already installed: `/opt/homebrew/opt/openjdk@17/`)
   ```bash
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
   ```

2. **Android SDK** (Needs setup)
   ```bash
   # Option A: Using Homebrew (requires disk space)
   brew install --cask android-commandlinetools
   
   # Option B: Manual installation
   # Download from: https://developer.android.com/tools/releases/command-line-tools
   ```

3. **Set Android SDK Path**
   ```bash
   export ANDROID_HOME=/path/to/android/sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
   ```

4. **Install Required SDK Components**
   ```bash
   sdkmanager --install "platforms;android-36"
   sdkmanager --install "build-tools;36.0.0"
   sdkmanager --install "ndk;27.1.12297006"
   ```

**Build Command:**
```bash
cd /Users/nikithgoudpalle/paisa-mart/mobile/android

# Set Java home and build
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
  ./gradlew assembleRelease

# Output will be at:
# app/build/outputs/apk/release/app-release.apk
```

### Method 3: GitHub Actions CI/CD (Recommended for Team)

**Best for:** Automated builds, team workflows

Create `.github/workflows/build-apk.yml`:
```yaml
name: Build APK

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          java-version: 17
          distribution: temurin
      - uses: android-actions/setup-android@v2
      
      - name: Install dependencies
        run: cd mobile && npm install
      
      - name: Build APK
        run: cd mobile/android && ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Method 4: Expo Prebuild + Manual Gradle Build

**Best for:** Direct control over build process

```bash
cd /Users/nikithgoudpalle/paisa-mart/mobile

# Prebuild already completed - verify
ls -la android/

# Clean and rebuild
rm -rf android/build

# Build with Gradle
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
./gradlew assembleDebug    # Debug build (faster)
./gradlew assembleRelease  # Release build (slower, smaller)
```

## Configuration Files Already Set Up

### `eas.json`
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "production": { "android": { "buildType": "apk" } },
    "preview": { "android": { "buildType": "apk" } },
    "development": { "android": { "buildType": "apk" } }
  }
}
```

### `app.json` (Android Config)
```json
{
  "android": {
    "package": "com.paisamart.app",
    "edgeToEdgeEnabled": true
  }
}
```

## Troubleshooting

### Issue: "SDK location not found"
**Solution:** Set `ANDROID_HOME` environment variable
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Issue: "Unable to locate Java Runtime"
**Solution:** Set JAVA_HOME
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

### Issue: "npm install exited with non-zero code"
**Solution:** Clear cache and retry
```bash
cd /Users/nikithgoudpalle/paisa-mart/mobile
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Disk full" during build
**Solution:** Clean gradle cache
```bash
cd /Users/nikithgoudpalle/paisa-mart/mobile/android
./gradlew clean
```

## Build Output Locations

| Build Type | Location |
|-----------|----------|
| Debug APK | `mobile/android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `mobile/android/app/build/outputs/apk/release/app-release.apk` |
| Build Reports | `mobile/android/build/reports/` |

## Next Steps

1. **Choose Build Method:** EAS Build (recommended) or Local Gradle
2. **Free Up Disk Space:** If building locally, ensure 10GB+ free space
3. **Set Environment Variables:** JAVA_HOME and ANDROID_HOME
4. **Run Build:** Follow the chosen method above
5. **Test APK:** Install on device/emulator with `adb install-multiple app-*.apk`

## Useful Commands

```bash
# Check Gradle version
cd mobile/android && ./gradlew --version

# Build info
./gradlew build --scan

# Debug build (faster for testing)
./gradlew assembleDebug

# Release build (optimized, smaller)
./gradlew assembleRelease

# Install APK on connected device
adb install app/build/outputs/apk/release/app-release.apk

# List connected devices
adb devices
```

## References

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Android Gradle Plugin](https://developer.android.com/build)
- [Gradle Build Tool](https://gradle.org/releases/)
