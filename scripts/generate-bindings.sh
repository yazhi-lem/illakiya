#!/bin/bash
# Generate Kotlin bindings using UniFFI
set -e

# Configuration
RUST_DIR="Projects/OSS/yazhi/apps/illakiya/core-rust"
ANDROID_DIR="Projects/OSS/yazhi/apps/illakiya/android/app/src/main/java/com/yazhi/illakiya/core"

# Check dependencies
if ! command -v cargo &> /dev/null; then
    echo "Rust is not installed. Please install Rust."
    exit 1
fi

echo "Building Rust crate..."
cd "$RUST_DIR"
cargo build --release

echo "Generating Kotlin bindings..."
cargo run --bin uniffi-bindgen generate --library ./target/release/libillakiya_core.so --language kotlin --out-dir "../../android/app/src/main/java/com/yazhi/illakiya/core"

echo "Bindings generated successfully!"
