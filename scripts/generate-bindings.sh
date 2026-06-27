#!/bin/bash
# Generate Kotlin bindings using UniFFI
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RUST_DIR="$PROJECT_DIR/core-rust"
ANDROID_BINDINGS_DIR="$PROJECT_DIR/android/app/src/main/java/com/yazhi/illakiya/core"

if ! command -v cargo &> /dev/null; then
    echo "Rust/Cargo is not installed. Please install Rust: https://rustup.rs"
    exit 1
fi

echo "Building Rust crate..."
cd "$RUST_DIR"
cargo build --release

echo "Generating Kotlin bindings..."
cargo run --bin uniffi-bindgen generate \
    --library ./target/release/libillakiya_core.so \
    --language kotlin \
    --out-dir "$ANDROID_BINDINGS_DIR"

echo "Bindings generated at: $ANDROID_BINDINGS_DIR"
