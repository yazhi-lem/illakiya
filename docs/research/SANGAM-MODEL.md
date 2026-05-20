# Sangam Tamil Model Research
**Created:** 2026-02-24 | **Focus:** Illakiya Keyboard Model

## Overview
Train a small Tamil language model based on Sangam literature - specifically illakanam (இலக்கணம் - grammar) and illakiyam (இலக்கியம் - literature).

## Sangam Literature Structure

### The 8 Anthologies (Ettuttokai)
1. **Netuntokai** - 400 long poems (Akam - love)
2. **Kuruntokai** - 400 short poems (Akam)
3. **Narrinai** - 400 landscape poems (Akam)
4. **Purananuru** - 400 outer poems (Puram - war/praise)
5. **Ainkurunuru** - 500 very short poems
6. **Patirruppattu** - Ten Tens
7. **Paripaatal** - Religious poems
8. **Kalittokai** - 1000+ poems

### The 10 Songs (Pattuppaattu)
- 10 long poems on ethics, kings, nature

### Key Statistics
- **2,381 poems** by **473 poets**
- **~102 anonymous** poems
- Period: 300 BCE - 300 CE (Scholarly consensus)

## Illakanam vs Illakiyam

### Illakanam (Grammar)
- **Tolkappiyam** - oldest Tamil grammar (1,610 sutras)
- 3 books: Eluttu (letters), Col (words), Porul (meaning)
- Phonology, morphology, prosody rules

### Illakiyam (Literature)
- Poetic compositions
- Themes: Akam (inner/love), Puram (outer/war)
- 5 landscapes (tinai): mountains, forests, pastures, seas, fields

## Training Approach for Illakiya Keyboard

### Phase 1: Small Model (Priority)
- Focus on **word prediction** for keyboard
- Train on: Tolkappiyam + basic corpus
- Goal: Suggest next Tamil word/phoneme

### Phase 2: Enhanced Model
- Add full Sangam poems
- Learn illakanam rules for better suggestions

### Data Sources
1. Project Madurai (free Tamil texts)
2. University of Chicago digital archives
3. Tamil Virtual Academy corpus

### Model Spec
- Base: XLM-RoBERTa (smaller variant)
- Params: ~50-100M (lightweight for keyboard)
- Fine-tune on Tamil text

## Next Steps
1. [ ] Acquire Tolkappiyam digital text
2. [ ] Collect 1000+ poems from Project Madurai
3. [ ] Clean and preprocess corpus
4. [ ] Run initial training notebook
