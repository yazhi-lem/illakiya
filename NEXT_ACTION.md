# Next Actions — Illakiya

> **Pivot (November 2026):** Illakiya is now a **Tamil writer by Yazhi**: research and write anything in Tamil, or paste anything (English, Tanglish, rough Tamil) and get clean Tamil. One centred box, modes below it, answers above it, follow-ups in the same box. The chapter editor, on-screen PM0100 keyboard and word suggestions are gone from the web app.

---

## 1. What ships today (web)

- [x] **Sarvam AI** (`sarvam-105b`) powers every answer (switched from Anthropic)
- [x] **தானியங்கு (Auto)**: automatic intent detection (heuristics, then a Sarvam classifier) picks research / write / translate / clean / grammar / formal / revise
- [x] **ஆய்ந்தெழுது (Research)**: Tamil + English Wikipedia lookup, then Tamil writing with sources
- [x] Chat layout with follow-ups, conversation saved in the browser, cobalt Yazhi theme
- [x] **தூய தமிழ் (Clean Tamil)** — anything → clean Tamil
- [x] **மொழிபெயர் (Translate)** — English → Tamil
- [x] **இலக்கணம் (Grammar)** — minimal Tamil grammar and spelling fixes
- [x] **எழுத்து நடை (Formal)** — colloquial → formal written Tamil
- [x] **Tanglish → தமிழ்** — offline transliteration in the browser
- [x] Streaming output, copy, text-to-speech, light/dark, mobile layout
- [x] `/api/tamil` Pages Function on Sarvam AI

## 2. Before public launch

1. **Set `SARVAM_API_KEY`** as a GitHub secret (synced on deploy) or directly on the Pages project. See `docs/DEPLOY.md`.
2. **Abuse protection for `/api/tamil`.** It is a public endpoint that spends API credit. Add Cloudflare rate limiting (WAF rule on `/api/*`) and/or Turnstile before announcing.
3. **Quality pass.** Collect 50–100 real samples (news, WhatsApp Tanglish, school essays, office letters, research questions) and review outputs and detected intents with Tamil editors. Tune `web/server/prompts.ts` and the heuristics in `web/server/intent.ts`.
4. **Usage metrics.** Count requests per tool (no stored text) to see which tools earn their place.

## 3. Next tools for the box

- Try Sarvam's dedicated translation model for the translate intent and compare quality
- Broader research sources (news, government sites) behind a search API key
- Summarise in Tamil (சுருக்கம்)
- Export an answer as .docx / PDF
- Tamil → English (for checking meaning)
- Simplify for young readers (எளிய தமிழ்)
- Document upload (.docx / .txt) and side-by-side diff of corrections

## 4. Android keyboard track

Status, build and Play Store checklist: [`docs/RELEASE_ANDROID.md`](docs/RELEASE_ANDROID.md).

- [x] Build modernised (AGP 8.13, Kotlin 2.2, targetSdk 36). CI builds the debug APK, release APK and AAB on every change, and attaches them to GitHub Releases on `v*` tags.
- [x] IME fixed: Compose lifecycle crash, consonant visibility, backspace and suggestion duplication. New PM0100 class-row layout, symbols, Enter and keyboard switch.
- [x] Sandhi engine aligned with Adhan's Swaram morphology. The keyboard offers only வல்லினம் மிகும் இடம் hints.
- [ ] Add the release signing secrets and cut `v0.3.0`.
- [ ] Device pass on Android 8 / 12 / 15+, then Play internal testing → closed pilot.
- [ ] Shared sandhi fixture with Adhan, so rule drift fails CI in both repos.
