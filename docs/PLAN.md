# Illakiya - Implementation Plan

## Architecture: Kotlin (UI) + Rust (Core) via UniFFI

---

## Phase 1: Layout & Design ✅ COMPLETE
- [x] PM0100 layout specification with Tholkaappiyam phonetic grouping
- [x] Full 247 Tamil character mapping (12 uyir + 18 mei + 216 uyirmei + ஃ)
- [x] Interaction model: tap (kuril), swipe-up (nedil), combination engine
- [x] Grantha letters planned for toggle layer

## Phase 2: Web Prototype ✅ COMPLETE
- [x] PWA with virtual keyboard and input engine
- [x] Service Worker for offline support
- [x] Suggestion bar with word completions
- [x] Arrow keys for cursor navigation

## Phase 3: Rust Core Engine ✅ COMPLETE
- [x] `tamil.rs` — Unicode classifier (Vallinam/Mellinam/Idaiyinam/Uyir)
- [x] `layout.rs` — PM0100 engine with 216 uyirmei combinations
- [x] `engine.rs` — State machine (pending buffer, nedil, word tracking)
- [x] `dictionary.rs` — Trie-based lookup (836 words, Sangam + modern + Tanglish)
- [x] `sandhi.rs` — 6 Tholkaappiyam Punarchi rules with confidence scoring
- [x] `illakiya.udl` — UniFFI interface definition
- [x] Unit tests for all modules

## Phase 4: Android IME ✅ COMPLETE (Structure)
- [x] `IllakiyaIME.kt` — InputMethodService with Compose UI
- [x] `KeyboardView.kt` — LazyVerticalGrid key renderer
- [x] `SettingsActivity.kt` — Theme/layout/Sandhi toggles (Compose)
- [x] `SuggestionStrip` — Dictionary + Sandhi hint display
- [x] Theme system — Sangam palette (KurunthogaiRed, MullaiSoil, PalaiSand, KurinjiNight)
- [x] `AndroidManifest.xml` + `method.xml` — IME registration
- [x] `build.gradle.kts` — rust-android-gradle plugin for cross-compilation
- [x] `proguard-rules.pro` — JNA/UniFFI preservation
- [x] `build-apk.sh` — Automated build script (4 ABIs)

## Phase 5: Dictionary & Data ✅ COMPLETE
- [x] Base dictionary: 247 → 836 words
- [x] Sangam corpus mining: 36,563 unique words from Project Madurai
- [x] Categories: literary, modern, tech, verbs, grammar, Tanglish, body/nature
- [x] Auto-transliteration for all entries
- [x] Recency boosting in suggestion engine

## Phase 6: Bridge & Build ✅ COMPLETE
- [x] UniFFI UDL with full API surface
- [x] `Cargo.toml` with conditional ONNX feature flag
- [x] `build.rs` scaffolding generator
- [x] `generate-bindings.sh` automation
- [x] `BRIDGE.md` engineering spec (architecture, data flow, perf targets)

---

## Phase 7: Testing & Polish 🔄 NEXT
- [ ] `cargo test` — Run full test suite on Rust-capable machine
- [ ] `./gradlew assembleDebug` — Build first APK
- [ ] Install on physical Android device for testing
- [ ] Expand dictionary to 2000+ words
- [ ] User dictionary persistence (SQLite)
- [ ] Swipe gesture detection refinement

## Phase 8: ONNX & AI 📋 PLANNED
- [ ] Adhan-Sandhi ONNX model (char-level BiLSTM, <2MB)
- [ ] Training data from `record_correction()` user overrides
- [ ] Next-word prediction (bigram model)
- [ ] Tanglish auto-detection mode

## Phase 9: Multi-Platform 📋 PLANNED
- [ ] iOS Custom Keyboard (Swift + Rust via UniFFI)
- [ ] Desktop IME (Linux XKB, macOS, Windows)
- [ ] Chrome Extension

## Phase 10: Release 📋 PLANNED
- [ ] Play Store listing
- [ ] F-Droid submission (FLOSS first)
- [ ] Documentation & onboarding tutorial
- [ ] Community feedback loop

---

**Codebase Stats:**
- Rust core: ~1,175 lines across 6 modules
- Kotlin UI: ~400 lines across 7 files
- Dictionary: 836 words from 10 sources
- Layout: 216 uyirmei combinations
- Engineering spec: 9KB detailed bridge document
