# Thozhan: Illakiya (Android) Dev Log

## Status: In-Progress — v0.2.0

## Architecture
```
core-rust/src/
  lib.rs          (11 lines)  — Module root
  tamil.rs        (90 lines)  — Unicode character classifier (Tholkaappiyam)
  layout.rs      (105 lines)  — PM0100 layout engine (216 combos)
  dictionary.rs  (226 lines)  — Trie-based word lookup + suggestions
  sandhi.rs      (314 lines)  — 6 Sandhi rules + correction recording
  engine.rs      (379 lines)  — Unified state machine
  illakiya.udl    (50 lines)  — UniFFI interface definition
  ─────────────────────────
  Total:        1,175 lines of Rust
```

## Completed
- [x] Layout: PM0100 with 247 Tamil characters (216 uyirmei combos)
- [x] Engine: State machine with pending consonant buffer + nedil support
- [x] Tamil module: Vallinam/Mellinam/Idaiyinam/Uyir classification
- [x] Dictionary: Trie prefix search, 350+ words, recency boosting
- [x] Sandhi: 6 Tholkaappiyam rules (Vallinam Migu, Mellinam Migu, Idaiyinam, Tontru, Uyirmei Tiribu, Iyalbu)
- [x] Sandhi: Correction recording for ONNX training data
- [x] Engine: Dictionary integration (suggestions, accept, valid word check)
- [x] Engine: Sandhi integration (word boundary detection, joining hints)
- [x] UDL: Full API surface (KeyboardEngine + AdhanSandhi + Dictionary)
- [x] IME Service: Updated with SuggestionStrip + Sandhi hints
- [x] BRIDGE.md: Comprehensive engineering spec (architecture, data flow, perf targets)

## Next Actions
1. [ ] `cargo test` — validate all modules compile and pass
2. [ ] Expand dictionary to 1000+ words (add Sangam literature vocabulary)
3. [ ] ONNX integration for Sandhi ambiguity resolution
4. [ ] User dictionary persistence (SQLite)
5. [ ] Tanglish mode (mixed Tamil-English detection)
