# Tamil Keyboard v2 - Roadmap

> **Q4 2026 note (added 8 Oct 2026).** This page dates from 22 Feb 2026. The Q4 2026 plan (Federal Mozhi) is an Android
> keyboard with **Tamil99 and phonetic** layouts, grapheme-safe backspace, on-device prediction and **no INTERNET permission**,
> reaching **Play Store open testing on 5 Dec 2026**. See [../../NEXT_ACTION.md](../../NEXT_ACTION.md).
> Points below that differ from the Q4 plan:
> - **"Yazhi Auth"** in the tech stack: the keyboard does not use the network, so the app has no sign-in path.
> - **"Learn from user / AI-powered predictions"**: on-device only.
> - **Dioxus / PWA**: the engine and base are undecided until the keyboard base is chosen.
> - **PM0100 layout**: v1 specifies Tamil99 and phonetic; PM0100's place is unclear.

## Vision
Best Tamil keyboard with Tholkappiam (PM0100) scientific layout.

---

## Current Status

| Feature | Status |
|---------|--------|
| Web Prototype | ✅ Ready |
| PM0100 Layout | ✅ Done |
| Uyirmei Combinations | ✅ Done |
| Mobile PWA | 🔄 In Progress |

---

## v2 Features

### 1. Mobile App (Priority)
- Convert to PWA installable
- Add to Play Store
- Native Android (Dioxus)

### 2. Predictions
- Word suggestions
- AI-powered predictions
- Learn from user

### 3. Themes
- Dark/Light mode
- Custom themes
- Tamil themes

### 4. Offline
- Works without internet
- Local dictionary

---

## Tech Stack

```
Dioxus (Mobile) → Rust Backend → Yazhi Auth
```



---

*Updated: 2026-02-22*
