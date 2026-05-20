# Thozhan + Arivu: Illakiya Dictionary Expansion

## Status: Complete — v2.0

## Dictionary Stats
| Metric | Before | After |
|--------|--------|-------|
| Total words | 247 | **836** |
| With English translation | 247 | 423 |
| With transliteration | 247 | **836** |
| File size | ~35 KB | **114 KB** |

## Sources
1. **Original base** (247 words) — Swadesh list + common Tamil
2. **Sangam corpus** (413 words) — Auto-extracted from Project Madurai via Arivu's corpus engine
3. **Modern daily** (30 words) — Education, government, society
4. **Body & nature** (25 words) — Anatomy, weather, flora
5. **Verbs** (22 words) — Common conjugations + tenses
6. **Grammar particles** (21 words) — Pronouns, postpositions
7. **Corpus literary** (21 words) — High-frequency Sangam terms
8. **Sangam literary** (20 words) — Tinai, turai, character types
9. **Tanglish** (20 words) — Borrowed English, colloquial Tamil
10. **Tech** (17 words) — Software, internet, devices

## Mining Stats (Arivu's Corpus)
- **36,563 unique Tamil words** found across 15 Project Madurai collections
- **152,051 total word occurrences** scanned
- Top 500 by frequency selected for dictionary inclusion
- Rough transliteration auto-generated for corpus-extracted words

## Integration
- Dictionary loaded via `include_str!` in Rust (114 KB embedded in binary)
- Trie index built at init for O(k) prefix search
- Recency boosting: +50 frequency for recently typed words
