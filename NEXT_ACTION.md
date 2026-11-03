# Next Actions — Illakiya

> **Pivot (November 2026):** Illakiya is now a **Tamil writer by Yazhi**: research and write anything in Tamil, or paste anything (English, Tanglish, rough Tamil) and get clean Tamil. One centred box, modes below it, answers above it, follow-ups in the same box. The chapter editor, on-screen PM0100 keyboard and word suggestions are gone from the web app.

---

## 1. What ships today (web)

- [x] **எழுது (Write)** — research (web search) and write any content in Tamil, with sources; default mode
- [x] Chat layout with follow-ups, conversation saved in the browser, cobalt Yazhi theme
- [x] **தூய தமிழ் (Clean Tamil)** — anything → clean Tamil
- [x] **மொழிபெயர் (Translate)** — English → Tamil
- [x] **இலக்கணம் (Grammar)** — minimal Tamil grammar and spelling fixes
- [x] **எழுத்து நடை (Formal)** — colloquial → formal written Tamil
- [x] **Tanglish → தமிழ்** — offline transliteration in the browser
- [x] Streaming output, copy, text-to-speech, light/dark, mobile layout
- [x] `/api/tamil` Pages Function on Claude, with server-side refusal fallback

## 2. Before public launch

1. **Set `ANTHROPIC_API_KEY`** as a GitHub secret (synced on deploy) or directly on the Pages project. See `docs/DEPLOY.md`.
2. **Abuse protection for `/api/tamil`.** It is a public endpoint that spends API credit. Add Cloudflare rate limiting (WAF rule on `/api/*`) and/or Turnstile before announcing.
3. **Quality pass.** Collect 50–100 real pasted samples (news, WhatsApp Tanglish, school essays, office letters) and review outputs with Tamil editors; tune the prompts in `web/server/tools.ts`.
4. **Usage metrics.** Count requests per tool (no stored text) to see which tools earn their place.

## 3. Next tools for the box

- Summarise in Tamil (சுருக்கம்)
- Export an answer as .docx / PDF
- Tamil → English (for checking meaning)
- Simplify for young readers (எளிய தமிழ்)
- Document upload (.docx / .txt) and side-by-side diff of corrections

## 4. Android keyboard track

`android/` and `core-rust/` (PM0100 keyboard, Rust engine) are unchanged and parked. Decide whether the keyboard continues as its own product or gets a "clean Tamil" action that calls the same `/api/tamil` endpoint.
