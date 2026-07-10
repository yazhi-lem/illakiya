#!/bin/bash
# Build the Illakiya core engine to WebAssembly for the web editor.
#
# Emits web/src/wasm/illakiya_core.js + illakiya_core_bg.wasm, which
# web/src/lib/engine.ts loads lazily to run native Rust composition/dictionary/
# sandhi in the browser. If this build is not run, the web app still works via
# its TypeScript fallback engine.
#
# Prerequisites:
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-pack          # or wasm-bindgen-cli
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$PROJECT_DIR/web/src/wasm"

echo "=== Illakiya WASM Build ==="

if ! command -v wasm-pack >/dev/null 2>&1; then
  echo "wasm-pack not found. Install it with:"
  echo "  cargo install wasm-pack"
  echo "(the web app runs fine on its TypeScript fallback until then)"
  exit 1
fi

rustup target add wasm32-unknown-unknown 2>/dev/null || true

cd "$PROJECT_DIR/core-rust"
echo "[1/1] Building with wasm-pack (feature: wasm)..."
wasm-pack build \
  --target web \
  --out-dir "$OUT_DIR" \
  --out-name illakiya_core \
  --no-typescript \
  -- --no-default-features --features wasm

echo ""
echo "=== BUILD SUCCESS ==="
echo "Artifacts in: web/src/wasm/"
echo "Reload the web app; engine.ts will pick up the native backend."
