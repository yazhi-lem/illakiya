#!/bin/bash
# Generate the UniFFI Kotlin bindings for core-rust into
# android/app/build/generated/uniffi/kotlin (Gradle also does this before every build).
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR/android"
./gradlew :app:generateUniffiBindings
