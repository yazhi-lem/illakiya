# Illakiya — இலக்கிய

**A native Tamil keyboard for Android, built with Rust + Kotlin.**

> Named after the Tamil word for "literature" (இலக்கியம்), Illakiya brings the elegance of Sangam poetry to modern mobile input.

---

## Architecture

```
┌─────────────────────────────┐
│     Android (Kotlin/Compose) │
│  IllakiyaIME → KeyboardView  │
│  SettingsActivity → Theme    │
│  SuggestionStrip             │
├──────────── UniFFI ──────────┤
│     Rust Core (libillakiya)  │
│  Engine → Layout → Dictionary│
│  Sandhi → Tamil Unicode      │
└─────────────────────────────┘
```

## Features

- **PM0100 Layout** — Phonetically grouped Tamil keyboard based on Tholkaappiyam
- **247 Tamil Characters** — All 12 vowels, 18 consonants, 216 combinations, ayutham
- **Nedil Swipe** — Swipe up for long vowels (குறில் → நெடில்)
- **Dictionary** — 836 words with Trie-based prefix search (<5ms)
- **Sandhi Engine** — 6 Tholkaappiyam Punarchi rules with confidence scoring
- **Sangam Theme** — UI inspired by Tamil literary landscapes (குறிஞ்சி, முல்லை, நெய்தல், பாலை, மருதம்)
- **Zero Filesystem** — All data embedded in binary via `include_str!`

## Quick Start

```bash
# Build APK (requires Android SDK + NDK + Rust)
./scripts/build-apk.sh

# Install
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Dictionary Sources

| Source | Words | Description |
|--------|-------|-------------|
| Swadesh + Common | 247 | Base vocabulary |
| Sangam Corpus | 413 | Project Madurai mining (36K unique words scanned) |
| Modern Tamil | 30 | Education, government, society |
| Verbs | 22 | Common conjugations |
| Grammar | 21 | Pronouns, particles, postpositions |
| Tanglish | 20 | Borrowed English, colloquial |
| Tech | 17 | Software, apps, internet |
| Literary | 20 | Tinai, turai, Sangam terms |
| Body & Nature | 25 | Anatomy, weather, flora |
| Corpus Frequent | 21 | High-frequency literary terms |

## Project Structure

```
illakiya/
├── android/                    # Android app
│   ├── app/
│   │   ├── build.gradle.kts   # Rust-Android-Gradle plugin
│   │   ├── proguard-rules.pro
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── res/xml/method.xml
│   │       └── java/com/yazhi/illakiya/
│   │           ├── service/IllakiyaIME.kt
│   │           ├── ui/keyboard/KeyboardView.kt
│   │           ├── ui/settings/SettingsActivity.kt
│   │           ├── ui/theme/{Theme,Color,Type}.kt
│   │           └── data/Layout.kt
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── gradle.properties
├── core-rust/                  # Rust engine
│   ├── Cargo.toml
│   ├── build.rs
│   ├── uniffi.toml
│   └── src/
│       ├── lib.rs
│       ├── illakiya.udl        # UniFFI interface
│       ├── engine.rs           # State machine
│       ├── layout.rs           # PM0100 loader
│       ├── dictionary.rs       # Trie + suggestions
│       ├── sandhi.rs           # Punarchi rules
│       └── tamil.rs            # Unicode classifier
├── data/
│   ├── dictionary/tamil_base.json  # 836 words
│   └── layouts/pm0100.json         # 216 combinations
├── docs/
│   ├── BRIDGE.md               # Engineering spec
│   ├── PLAN.md                 # Implementation plan
│   └── SPEC_NATIVE_V2.md      # Native architecture spec
├── scripts/
│   ├── build-apk.sh           # Build automation
│   └── generate-bindings.sh   # UniFFI bindgen
└── web/                        # Legacy web prototype (PWA)
```

## Sangam Theme Palette

| Color | Name | Hex | Inspiration |
|-------|------|-----|-------------|
| 🔴 Primary | KurunthogaiRed | `#8B2500` | Kurunthogai love poems |
| 🟤 Surface | MullaiSoil | `#3E2723` | Forest earth |
| 🟡 Accent | PalaiSand | `#D4A574` | Desert landscape |
| 🔵 Dark | KurinjiNight | `#1A1A2E` | Mountain twilight |

## Tech Stack

- **Kotlin** — Android UI (Jetpack Compose, Material 3)
- **Rust** — Core engine (state machine, dictionary, sandhi)
- **UniFFI** — FFI bridge (Mozilla, type-safe)
- **JNA** — Java Native Access (runtime FFI loader)

## License

Part of the [Yazhi](https://github.com/yazhi-lem) open source ecosystem.  
FLOSS-first. Community-driven. Tamil-powered.

---

*வாழ்க தமிழ்! — Long live Tamil!*
