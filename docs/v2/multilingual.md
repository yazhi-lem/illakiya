# Multilingual Keyboard v2 - Approach

## Vision
A single keyboard that supports Tamil, Hindi, Telugu, Malayalam, and more - all in one app.

---

## Why Multi-Language?

| Market | Users |
|--------|-------|
| Tamil | 80M |
| Hindi | 600M |
| Telugu | 80M |
| Malayalam | 38M |
| Kannada | 40M |
| **Total** | **~1B** |

One app = more users = more impact

---

## Language Support

### Phase 1 (Launch)
- [x] Tamil (PM0100 layout) ✅
- [ ] Hindi (Devanagari)
- [ ] Telugu

### Phase 2
- [ ] Malayalam
- [ ] Kannada
- [ ] Bengali

### Phase 3
- [ ] All 22 Indian languages

---

## Technical Approach

### 1. Layout Switching
```swift
// Language selector
enum Language {
    case tamil(PM0100Layout)
    case hindi(InscriptLayout)
    case telugu(PhoneLayout)
}
```

### 2. Script Detection
- Auto-detect based on typing
- Manual override

### 3. Unified Input Engine
```rust
struct InputEngine {
    current_lang: Language,
    layout: Layout,
    predict: Option<Model>,
}
```

### 4. Shared Predictions
- One AI model for all languages
- Language-specific fine-tuning

---

## UI Design

```
┌─────────────────────────────────────┐
│ [EN ▼] [😊] [🔤]                   │
├─────────────────────────────────────┤
│                                     │
│    க்  ச்  ட்  த்  ப்  ற்   │
│                                     │
│    ய்   ர்   ல்   வ்   ழ்   ள்   │
│                                     │
│   [Space Bar]        [Enter]       │
└─────────────────────────────────────┘
```

Language picker in top bar.

---

## Monetization

| Tier | Price | Languages |
|------|-------|------------|
| Free | ₹0 | Tamil only |
| Pro | ₹199 | All 6 languages |
| Enterprise | ₹4999 | All + custom |

---

## Competitors

| App | Weakness | Our Advantage |
|-----|----------|---------------|
| Google Indic | Generic | Tamil-first |
| SwiftKey | Paid features | Open source |
| Indic KB | Basic | AI predictions |

---

*Approach: Kanaku*
*Date: 2026-02-22*
