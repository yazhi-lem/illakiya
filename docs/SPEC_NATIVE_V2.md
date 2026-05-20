# SPEC: Illakiya Android Native (Kotlin + Rust)

## 1. Goal
Build a system-wide Android Input Method (IME) that matches native performance while implementing the **PM0100 (Sangam Earth)** keyboard layout.

## 2. Architecture
- **UI Layer (Kotlin + Jetpack Compose):** Handles key rendering, touch feedback, and animations.
- **Service Layer (Kotlin):** Extends `InputMethodService`. Manages communication with the Android system and the input buffer.
- **Core Engine (Rust):**
    - `Logic`: PM0100 Uyirmei combination rules.
    - `Dictionary`: Fast lookups for autocorrect.
    - `Predictions`: Adhan-lite for next-word suggestions.
- **Bridge:** UniFFI for calling Rust logic from Kotlin.

## 3. UI Requirements
- **Dynamic Key Sizing:** Adjust for portrait/landscape.
- **Gesture Support:**
    - Swipe up on Consonant -> Nedil variation.
    - Long press -> Special characters / Grantha.
- **Theming:** "Sangam Earth" (Dark browns, forest greens, gold accents).

## 4. Performance Targets
- **Cold Start:** < 100ms.
- **Key Latency:** < 10ms.
- **Memory Footprint:** < 40MB.

---

# SPEC: Illakiya Web Tutorial (V2 Migration)

## 1. Concept
Pivot the existing React Native (Web) prototype into an interactive "Typing School" and "Cloud Notepad" for the PM0100 layout.

## 2. Features
### A. The Interactive Tutor
- Step-by-step lessons: "Learning the Vowels", "The Power of Consonants", "Combining into Uyirmei".
- Ghost-key overlays to show where to tap.

### B. The PM0100 Editor
- A full-screen markdown-capable editor.
- **Persistence:** Automatic sync to local storage and optional Yazhi-Auth sync.
- **Export:** Save as PDF, Text, or share directly to WhatsApp/Signal.

### C. Note Maintenance
- Sidebar for "Recent Notes".
- Tagging system (e.g., #Sangam, #Poetry, #Work).

## 3. Implementation
- **Framework:** React + Tailwind CSS (Optimized for mobile web).
- **Editor:** Monaco Editor or Lexical with Tamil font support.
- **Storage:** IndexedDB for large note collections.
