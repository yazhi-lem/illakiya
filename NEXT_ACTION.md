# Founder Refresher & Next Actions — Illakiya

> **Milestone Expectations:**
> - 🎯 **October 2026:** Pilot Release — Standalone Android APK with Rust IME Engine & Tholkappiyam Morphological Layout
> - 🚀 **December 2026:** Public Launch — Full App Store / Play Store Release with On-Device Predictive Text & Stylized Keycap Themes

---

## 1. Executive Summary & Architecture

Illakiya (இலக்கிய) is a native Tamil keyboard and text editor for Android combining a high-performance **Rust Core Engine** with **Kotlin Android IME integration**, designed around the phonetic and orthographic principles of Tholkappiyam.

---

## 2. October 2026 Pilot Scope

- [ ] **Rust Core & JNA / FFI Stability:**
  - Zero-overhead character aggregation and agglutination handling in Rust core.
  - Sub-10ms keypress-to-render latency on entry-level Android devices.
- [ ] **Tholkappiyam Keyboard Layout:**
  - Ergonomic Akshara/Swaram clustering layout for intuitive Tamil composition.
- [ ] **Pilot APK Distribution:**
  - Unsigned test APKs for closed beta testers across Android 8.0+.

---

## 3. December 2026 Launch Scope

- [ ] **On-Device Tamil Next-Word Prediction:**
  - Lightweight n-gram / SLM token prediction running local inference without network access.
- [ ] **Play Store Production Release:**
  - Signed release build conforming to Google Play IME security requirements.
- [ ] **Sangam Literature Themes:**
  - Tiṇai aesthetic keyboard themes (Kurinji, Mullai, Marutham, Neithal, Palai).

---

## 4. Immediate Next Actions

1. Validate Rust crate test suite (`cargo test`) and cross-compilation targets (`cargo ndk`).
2. Verify Kotlin InputMethodService lifecycle handlers on orientation change and app switching.
3. Benchmark memory footprint under heavy typing sessions.
