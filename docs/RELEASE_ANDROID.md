# Releasing the Illakiya Android keyboard

Status, build steps and the Play Store checklist for the PM0100 Tamil keyboard
(`android/` + `core-rust/`).

## Status (November 2026)

| Area | State |
|---|---|
| Rust core (`core-rust`) | ✅ Tests, clippy and rustfmt pass in CI. The PM0100 layout covers all 247 letters. The dictionary has 836 words. |
| Android build | ✅ Builds in CI (`.github/workflows/android.yml`): debug APK, release APK, AAB, release lint and debug lint. The first run passed in 6 min ([run 41659035611](https://github.com/yazhi-lem/illakiya/actions/runs/41659035611)). |
| Toolchain | Gradle 8.14.3 · AGP 8.13.0 · Kotlin 2.2.21 · Compose BOM 2025.06.01 · compileSdk/targetSdk 36 · minSdk 26 · JDK 17 |
| Native libs | `arm64-v8a`, `armeabi-v7a`, `x86_64`, built with `cargo-ndk` (API 26) |
| IME | PM0100 layout (வல்லினம் / இடையினம் / மெல்லினம் rows + vowels), நெடில் by long-press or ⇧, symbols and digits, Enter with editor actions, keyboard switch, held backspace repeats, suggestions, வல்லினம் மிகும் hints |
| Privacy | No INTERNET permission; nothing typed leaves the device |
| Release signing | Supported through secrets (below); **not configured yet** |
| Device testing | **Not done yet**: CI compiles and lints the app but no build has run on a phone |

## Sandhi engine (Adhan-Sandhi)

`core-rust/src/sandhi.rs` follows Adhan's Swaram morphology
(`yazhi-lem/adhan` → `src/adhan_slm/tokenizer/morphology.py`):
- Work on aksharas.
- Let a consonant take the following vowel.
- Pick ய்/வ் glides by vowel class.

It adds rules Adhan does not have yet:
- தனிக்குறில் doubling
- ல்/ன் → ற் and ள்/ண் → ட்
- குற்றியலுகரம் deletion
- No migu after nasal finals

30 canonical joins are tested, including all 13 of Adhan's. A test also checks that no output puts a consonant before a free vowel.

**On the keyboard** the engine is used only for **வல்லினம் மிகும் இடம்** between words. After ஐ, கு, ஆக, -க்க infinitives and demonstratives like அந்த or இந்த, it offers the doubled consonant: பள்ளிக்கு சென்றான் → பள்ளிக்குச் சென்றான். It never merges two words into one.

**Adhan migration.** Adhan's Swaram tokenizer is Python, so the phone can't use it directly. The rules now track Adhan's table, so the two engines agree.
- **Next step:** generate a shared JSON fixture of sandhi cases in Adhan and run it in both test suites, so rule drift fails CI.
- **When on-device prediction lands:** use a Rust port of the Swaram akshara segmenter. `tamil::aksharas` already matches Adhan's Layer A segmentation for Tamil letters.

## Build locally

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
cargo install cargo-ndk
export ANDROID_HOME=~/Android/Sdk          # SDK with an NDK installed
./scripts/build-apk.sh                     # debug APK, release APK, release AAB
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Gradle builds the Rust core and generates the UniFFI Kotlin bindings before compiling. You don't need to run anything by hand.

## Signing (one time)

```bash
keytool -genkeypair -v -keystore illakiya-release.jks -alias illakiya \
  -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 illakiya-release.jks > illakiya-release.jks.b64
```

Add these GitHub repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `ILLAKIYA_KEYSTORE_BASE64` | contents of `illakiya-release.jks.b64` |
| `ILLAKIYA_KEYSTORE_PASSWORD` | keystore password |
| `ILLAKIYA_KEY_ALIAS` | `illakiya` |
| `ILLAKIYA_KEY_PASSWORD` | key password |

Keep the `.jks` file and both passwords offline. Use Play App Signing: this key becomes the **upload key**, and Google holds the app signing key.

## Cut a release

1. Bump `versionName` if needed. CI sets it from the tag, and `versionCode` from the run number.
2. Tag and push: `git tag v0.3.0 && git push origin v0.3.0`.
3. CI builds and attaches `app-release.apk` and `app-release.aab` to the GitHub Release for the tag.

## Play Store checklist

- [ ] Signing secrets configured, and the tag build produces a signed AAB.
- [ ] Device pass on at least one phone each for Android 8, 12 and 15/16. Check typing, suggestions, the sandhi chip, Enter in a search field and a chat app, the keyboard switch key, number fields opening the symbols layer, and dark and light system themes.
- [ ] Play listing: Tamil and English description, screenshots of the keyboard and settings, feature graphic.
- [ ] Data safety form: **no data collected or shared** (no network permission).
- [ ] Privacy policy URL (required for keyboards). State that typed text never leaves the device.
- [ ] Content rating questionnaire.
- [ ] Internal testing track → closed testing (pilot) → production.

## Known limits for the pilot

- If you edit text with gestures or the cursor mid-word, the engine resets its view of the current word. Suggestions restart from the next word.
- R8 minification is off: JNA and the UniFFI bindings use reflection. Turn it on once the keep rules are checked on a device.
- No swipe-to-nedil gesture yet. Use long-press or ⇧ நெடில்.
- AGP reports it can't strip the native libraries (`libillakiya_core.so`), so they ship with symbols. Set `ndkVersion` and add `strip = true` to the release profile in `Cargo.toml` to cut APK size.
- The dictionary is small (836 words). Expanding it is tracked in `docs/dictionary-expansion.md`.
