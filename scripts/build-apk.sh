#!/bin/bash
# Build Illakiya APK (Debug)
# Prerequisites: Android SDK, NDK r25+, Rust toolchain with android targets
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Illakiya APK Build ==="
echo ""

# Step 1: Install Rust Android targets (if needed)
echo "[1/4] Checking Rust Android targets..."
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android 2>/dev/null || true

# Step 2: Build Rust core
echo "[2/4] Building Rust core..."
cd "$PROJECT_DIR/core-rust"
cargo build --release
echo "  -> libillakiya_core built"

# Step 3: Generate Kotlin bindings
echo "[3/4] Generating UniFFI bindings..."
cargo run --bin uniffi-bindgen generate \
    --library ./target/release/libillakiya_core.so \
    --language kotlin \
    --out-dir "$PROJECT_DIR/android/app/src/main/java/com/yazhi/illakiya/core"
echo "  -> Kotlin bindings generated"

# Step 4: Build APK
echo "[4/4] Building APK..."
cd "$PROJECT_DIR/android"
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "=== BUILD SUCCESS ==="
    echo "APK: $APK_PATH ($SIZE)"
    echo "Install: adb install $APK_PATH"
else
    echo "BUILD FAILED: APK not found"
    exit 1
fi
