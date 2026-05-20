# Engineering Spec: The Bifrost Bridge (Kotlin ↔ Rust)

## 1. Overview

The "Bifrost" is the Foreign Function Interface (FFI) layer connecting the **Android JVM (Kotlin)** to the **Illakiya Core (Rust)**. Built on [Mozilla UniFFI](https://github.com/mozilla/uniffi-rs) for automated, type-safe binding generation.

**Version:** 0.2.0  
**Last Updated:** 2026-02-27

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ANDROID LAYER                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ IllakiyaIME  │  │SettingsAct.  │  │KeyboardView  │  │
│  │ (Service)    │  │ (Compose)    │  │ (Compose)    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────┐    │
│  │            SuggestionStrip (Compose)             │    │
│  │   [⚡ Sandhi]  [Dict Word 1]  [Dict Word 2]     │    │
│  └──────┬──────────────────────────────────────────┘    │
│         │                                                │
│  ═══════╪═══════════ JNI / UniFFI ══════════════════    │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────┐    │
│  │              RUST CORE (libillakiya.so)          │    │
│  │                                                  │    │
│  │  ┌────────────────────────────────────────────┐ │    │
│  │  │           KeyboardEngine                    │ │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ │ │    │
│  │  │  │  Layout   │ │Dictionary│ │AdhanSandhi │ │ │    │
│  │  │  │ (PM0100)  │ │ (Trie)  │ │  (Rules)   │ │ │    │
│  │  │  └──────────┘ └──────────┘ └────────────┘ │ │    │
│  │  │                                            │ │    │
│  │  │  ┌──────────┐ ┌──────────────────────────┐│ │    │
│  │  │  │  Tamil    │ │   State Machine          ││ │    │
│  │  │  │ (Unicode) │ │ pending | buffer | words ││ │    │
│  │  │  └──────────┘ └──────────────────────────┘│ │    │
│  │  └────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Module Breakdown

### 3.1 `tamil.rs` — Unicode Character Classifier
Classifies Tamil characters by Tholkaappiyam's phonetic system:
- **Vallinam** (hard): க, ச, ட, த, ப, ற
- **Mellinam** (soft/nasal): ங, ஞ, ண, ந, ம, ன
- **Idaiyinam** (medium): ய, ர, ல, வ, ழ, ள
- **Uyir** (vowels): 5 kuril (short) + 7 nedil (long) = 12
- Utility: `vallinam_to_mellinam()` mapping, `ends_with_pulli()`, `ends_with_short_vowel()`

### 3.2 `layout.rs` — PM0100 Layout Engine
- Loads `pm0100.json` via `include_str!` (zero filesystem dependency)
- 4 key layers: `base` (19 consonants), `vowels` (5 short), `vowels_long` (5 long), `vowels_special` (2: ஐ, ஔ)
- 216 uyirmei combination lookups via `combine(consonant, vowel)`
- `any_vowel_lookup(key, is_long)` resolves across all vowel layers

### 3.3 `dictionary.rs` — Trie-Based Word Lookup
- Loaded from `tamil_base.json` (350+ words, expandable)
- **Trie** structure for O(k) prefix search (k = prefix length)
- `suggest(prefix, limit)` returns frequency-ranked completions
- Recency boosting: recently typed words get +50 frequency score
- `translate()` and `transliterate()` for bilingual support
- `record_usage()` tracks typing patterns for personalization

### 3.4 `sandhi.rs` — Adhan-Sandhi Punarchi Engine
Implements 6 Tamil Sandhi rules from Tholkaappiyam:

| Rule | Name | Example | Confidence |
|------|------|---------|------------|
| 1 | **Vallinam Migu** | பூ + கொடி → பூக்கொடி | 0.80 |
| 2 | **Mellinam Migu** | பொன் + கலம் → பொங்கலம் | 0.75 |
| 3 | **Idaiyinam Insertion** | அ + அ → அயஅ (ய் glide) | 0.70 |
| 4 | **Tontru Punarchi** | மண் + அழகு → மணழகு | 0.75 |
| 5 | **Uyirmei Tiribu** | நிலா + ஒளி → நிலவொளி | 0.70 |
| 6 | **Iyalbu Punarchi** | (fallback concatenation) | 0.60 |

- `analyze()` returns `SandhiResult { output, rule, confidence }`
- `record_correction()` stores user overrides for future ONNX training data
- Phase 2: ONNX model (`ort` crate) for ambiguous cases

### 3.5 `engine.rs` — Unified Keyboard Engine
The orchestrator. Integrates all modules into a single state machine:
- **State:** `buffer`, `pending_consonant`, `nedil_active`, `words[]`, `current_word`
- **Input flow:** key → vowel/consonant check → combination → buffer update → suggestion refresh
- **Suggestions:** `get_suggestions(limit)` queries dictionary trie with current prefix
- **Sandhi:** `get_sandhi_suggestion()` checks last completed word against current word
- **Accept:** `accept_suggestion(word)` replaces current partial with full word

---

## 4. Data Flow

```
User taps 'க' (key "q")
  │
  ├─ engine.process_input("q")
  │    ├─ layout.base_lookup("q") → Some("க்")
  │    ├─ pending_consonant = Some("க்")
  │    └─ return "" (buffering)
  │
User taps 'அ' (key "z")
  │
  ├─ engine.process_input("z")
  │    ├─ layout.any_vowel_lookup("z", false) → Some("அ")
  │    ├─ pending_consonant = Some("க்") → take!
  │    ├─ layout.combine("க்", "அ") → Some("க")
  │    ├─ buffer += "க", current_word += "க"
  │    └─ return "க" → commit to InputConnection
  │
UI refreshes:
  │
  ├─ engine.get_suggestions(5)
  │    └─ dictionary.suggest("க", 5) → ["காதல்", "கடல்", "காடு", ...]
  │
  ├─ engine.get_sandhi_suggestion()
  │    └─ None (no previous word yet)
  │
  └─ engine.get_pending() → None
```

---

## 5. Memory & Safety

| Concern | Solution |
|---------|----------|
| Ownership | Rust owns all data; Kotlin holds opaque handle via UniFFI Arc |
| Thread safety | Engine is single-threaded (IME runs on UI thread) |
| Panic handling | UniFFI catches panics → `RuntimeException` on JVM |
| Memory leaks | UniFFI destructor releases Rust objects when Kotlin GC collects |
| Dictionary size | 350 words × ~200 bytes ≈ 70KB (fits in L1 cache) |
| Layout size | 216 combos × ~50 bytes ≈ 11KB embedded in .so |

---

## 6. UniFFI Type Mapping

| Rust | Kotlin | Notes |
|------|--------|-------|
| `String` | `String` | UTF-8 guaranteed |
| `u32` | `UInt` | Kotlin unsigned |
| `bool` | `Boolean` | Direct |
| `Vec<String>` | `List<String>` | Auto-converted |
| `Option<String>` | `String?` | Nullable |
| `Result<T,E>` | `@Throws` | Exception mapping |
| `&str` param | `String` | UniFFI copies to owned |

---

## 7. Build Pipeline

```bash
# 1. Compile Rust for Android targets
cargo build --release --target aarch64-linux-android
cargo build --release --target armv7-linux-androideabi
cargo build --release --target x86_64-linux-android
cargo build --release --target i686-linux-android

# 2. Generate Kotlin bindings
cargo run --bin uniffi-bindgen generate \
  --library target/release/libillakiya_core.so \
  --language kotlin \
  --out-dir ../android/app/src/main/java/com/yazhi/illakiya/core

# 3. Build APK
cd ../android && ./gradlew assembleDebug

# Automated: scripts/build-apk.sh
```

---

## 8. API Surface (UDL)

### KeyboardEngine
| Method | Returns | Description |
|--------|---------|-------------|
| `process_input(key)` | `String` | Process keypress, return commit text |
| `toggle_nedil()` | void | Toggle long vowel mode |
| `accept_suggestion(word)` | `String` | Accept suggestion, replace current word |
| `get_buffer()` | `String` | Full text buffer |
| `get_pending()` | `String?` | Pending consonant (for UI underline) |
| `get_current_word()` | `String` | Current partial word |
| `is_nedil_active()` | `bool` | Nedil mode state |
| `get_suggestions(limit)` | `Vec<String>` | Dictionary suggestions |
| `is_valid_word(word)` | `bool` | Dictionary lookup |
| `translate_current()` | `String?` | English translation |
| `dictionary_size()` | `u32` | Word count |
| `get_sandhi_suggestion()` | `String?` | Sandhi joining hint |
| `reset()` | void | Clear all state |

### AdhanSandhi
| Method | Returns | Description |
|--------|---------|-------------|
| `check_punarchi(w1, w2)` | `String` | Apply sandhi rules |
| `record_correction(w1, w2, expected)` | void | Record user fix |
| `get_corrections_count()` | `u32` | Correction log size |

### Dictionary
| Method | Returns | Description |
|--------|---------|-------------|
| `contains(word)` | `bool` | Exact match check |
| `suggest(prefix, limit)` | `Vec<String>` | Prefix search |
| `translate(word)` | `String?` | Tamil → English |
| `transliterate(word)` | `String?` | Tamil → Latin |
| `record_usage(word)` | void | Track for recency |
| `word_count()` | `u32` | Total entries |

---

## 9. Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Key-to-screen latency | < 16ms | 60fps frame budget |
| Suggestion lookup | < 5ms | Trie is O(k) |
| Sandhi analysis | < 2ms | Rule-based, no allocation |
| APK size (core .so) | < 2MB | Embedded data is tiny |
| Memory (runtime) | < 5MB | Dictionary + trie + buffer |
| Cold start | < 100ms | `include_str!` = no I/O |

---

## 10. Future (Phase 2)

- **ONNX Sandhi Model:** Replace rule-based confidence < 0.7 with model inference
- **User Dictionary:** Persist `record_usage` + `record_correction` to SQLite
- **Bigram Prediction:** Next-word prediction based on word pairs
- **Tanglish Mode:** Mixed Tamil-English input with auto-detection
