# Next Actions: Illakiya (Q4 2026)

> This file mirrors the Yazhi Q4 2026 launch plan as of **8 Oct 2026**.

| | |
|---|---|
| Federal | **Mozhi** (shared with Open Sangam) |
| Goals | A word-list contribution path for the community; on-device next-word prediction |
| Q4 launch | **Play Store open testing, 5 Dec 2026** (a beta, not a production store release) |
| v1 scope | Android first. Tamil99 and phonetic layouts, grapheme-safe backspace, English toggle, on-device next-word prediction |
| Privacy promise | Nothing typed leaves the phone. The app ships **without the INTERNET permission**, so it cannot send data |

## Plan by milestone

Milestones: Spec → Core → Predict → Play beta → Grow.

| Target date | Milestone | What |
|---|---|---|
| 12 Oct 2026 | Spec | Specify the Tamil99 and phonetic layouts for Illakiya |
| 15 Oct 2026 | Spec | Write the grapheme-safe backspace and English toggle spec |
| 18 Oct 2026 | Spec | Choose open-source keyboard base |
| 8 Nov 2026 | Core | Build the input engine with Tamil99 and phonetic layouts |
| 8 Nov 2026 | Core | Remove INTERNET permission from Illakiya manifest |
| 15 Nov 2026 | Core | Write and pass the 1,000-word grapheme correctness test |
| 18 Nov 2026 | Predict | Build the Tamil frequency word list from a licensed corpus |
| 22 Nov 2026 | Predict | Build on-device next-word prediction and completion |
| 25 Nov 2026 | Predict | Get 10 native testers to rate Illakiya suggestions |
| 30 Nov 2026 | Play beta | Run the Illakiya internal testing track with 30 users |
| 3 Dec 2026 | Play beta | Reach >99% crash-free sessions on Illakiya |
| 5 Dec 2026 | Play beta | Launch Illakiya open testing on the Play Store |
| 20 Dec 2026 | Grow | Open a word-list contribution path on circle.yazhi.dev |
| 31 Dec 2026 | Grow | Write the Illakiya iOS feasibility note with effort estimate |

## Open questions

- **Layout:** the Q4 plan specifies **Tamil99 and phonetic** layouts. This repo was built around the **Tholkappiyam / PM0100**
  layout. Whether PM0100 ships in v1, ships later, or is dropped is **unclear**. It will be settled in the layout spec.
- **Engine and base:** the previous NEXT_ACTION described a Rust core with a Kotlin IME, while `docs/v2/roadmap.md` (Feb 2026)
  says Dioxus. Choosing the open-source keyboard base is still open (due 18 Oct). Treat the stack as **undecided** until then.
- **Prediction:** must run fully on-device. "Learn from user" and "AI-powered predictions" ideas from the v2 roadmap are fine
  only if they never need the network.

## Immediate next actions

1. Specify the Tamil99 and phonetic layouts and settle the PM0100 question (due 12 Oct).
2. Write the grapheme-safe backspace and English toggle spec (due 15 Oct).
3. Choose the open-source keyboard base (due 18 Oct).
4. Work through the mirrored GitHub issues (#7–#15) in milestone order.

## What changed from the previous version of this file

The previous file promised an **October pilot APK** and a **December production Play Store release** with Tiṇai themes. The Q4
plan has no October pilot. The Q4 target is **Play Store open testing on 5 Dec**, after a 30-user internal testing track and
>99% crash-free sessions. Themes are not on the Q4 plan.
