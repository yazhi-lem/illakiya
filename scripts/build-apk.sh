#!/bin/bash
# Build the Illakiya keyboard APKs (debug + release) and the Play Store bundle.
#
# Prerequisites:
#   - JDK 17, Android SDK (ANDROID_HOME) with an NDK (or ANDROID_NDK_HOME)
#   - Rust:  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
#   - cargo install cargo-ndk
# Gradle builds core-rust with cargo-ndk and generates the UniFFI Kotlin bindings itself.
# To sign the release build set ILLAKIYA_KEYSTORE_PATH, ILLAKIYA_KEYSTORE_PASSWORD,
# ILLAKIYA_KEY_ALIAS and ILLAKIYA_KEY_PASSWORD (see docs/RELEASE_ANDROID.md).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

command -v cargo-ndk >/dev/null || { echo "cargo-ndk missing: cargo install cargo-ndk"; exit 1; }

cd "$PROJECT_DIR/android"
./gradlew assembleDebug assembleRelease bundleRelease "$@"

echo ""
echo "=== BUILD SUCCESS ==="
ls -lh app/build/outputs/apk/debug/*.apk app/build/outputs/apk/release/*.apk app/build/outputs/bundle/release/*.aab
echo "Install debug: adb install -r app/build/outputs/apk/debug/app-debug.apk"
