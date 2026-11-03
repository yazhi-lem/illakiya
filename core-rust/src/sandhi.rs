//! Adhan-Sandhi: Tamil word-joining (புணர்ச்சி) engine.
//!
//! The rule table follows Adhan's Swaram morphology
//! (`yazhi-lem/adhan`, `src/adhan_slm/tokenizer/morphology.py`): work on
//! aksharas, and when a consonant meets a vowel, let the consonant take the
//! vowel (திரு + அடி → திருவடி, never திருவ்அடி / திருவஅடி). On top of
//! Adhan's table this adds the classical Nannūl rules it leaves out:
//!
//! | rule | example |
//! |---|---|
//! | உடம்படுமெய் (glide ய்/வ்) | பசி + இல்லை → பசியில்லை, திரு + அடி → திருவடி |
//! | குற்றியலுகரம் கெடல் | காடு + அழகு → காடழகு |
//! | தனிக்குறில் முன் ஒற்று இரட்டல் | கல் + அடி → கல்லடி, மண் + அழகு → மண்ணழகு |
//! | மெய் + உயிர் (இயல்பு) | அவன் + அழகன் → அவனழகன் |
//! | ம் திரிதல் | மரம் + அடி → மரவடி, மரம் + தோப்பு → மரத்தோப்பு |
//! | ல்/ன் → ற், ள்/ண் → ட் (தனிக்குறில்) | கல் + குடம் → கற்குடம், பொன் + கலம் → பொற்கலம் |
//! | வல்லினம் மிகுதல் | நீர் + துளி → நீர்த்துளி, வாழை + பழம் → வாழைப்பழம் |
//!
//! Joining is meant for compounds. Between two separate written words, the
//! keyboard only offers `migu_between_words` — inserting the doubled hard
//! consonant at the end of the first word (பள்ளிக்கு சென்றான் →
//! பள்ளிக்குச் சென்றான்), which is the common spelling error writers make.

use crate::tamil::{self, Akshara};
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, uniffi::Enum)]
pub enum SandhiRule {
    /// இயல்பு — no change: the words simply meet.
    IyalbuPunarchi,
    /// வல்லினம் மிகுதல் — the next hard consonant doubles.
    VallinamMigu,
    /// தனிக்குறில் முன் ஒற்று — the final consonant doubles before a vowel.
    MeiMigu,
    /// உடம்படுமெய் — a glide (ய்/வ்) appears between two vowels.
    UdambaduMei,
    /// திரிதல் — the final consonant changes (ம்→வ, ல்→ற், ள்→ட், …).
    MeiTiribu,
    /// குற்றியலுகரம் — the final short உ drops before a vowel.
    KutriyalugaramKedal,
    /// Nothing to join (an empty word).
    NoRule,
}

#[derive(Debug, Clone, uniffi::Record)]
pub struct SandhiResult {
    pub output: String,
    pub rule: SandhiRule,
    pub confidence: f32,
}

#[derive(Debug, Clone, uniffi::Record)]
pub struct SandhiCorrection {
    pub word1: String,
    pub word2: String,
    pub expected: String,
    pub rule_applied: String,
}

#[derive(uniffi::Object)]
pub struct AdhanSandhi {
    corrections: std::sync::RwLock<Vec<SandhiCorrection>>,
}

fn result(output: String, rule: SandhiRule, confidence: f32) -> SandhiResult {
    SandhiResult {
        output,
        rule,
        confidence,
    }
}

/// க, ச, த, ப — the hard consonants a Tamil word can start with.
fn starts_with_vallinam(word: &str) -> Option<char> {
    word.chars().next().filter(|&c| tamil::is_vallinam(c))
}

fn starts_with_vowel(word: &str) -> bool {
    word.chars().next().is_some_and(tamil::is_uyir)
}

/// தனிக்குறில் முன் ஒற்று: one short open syllable then a consonant (கல், மண், பொன்).
fn is_short_closed_monosyllable(aksharas: &[&str]) -> bool {
    aksharas.len() == 2
        && tamil::is_short_syllable(aksharas[0])
        && tamil::classify(aksharas[1]) == Akshara::Mei
}

/// குற்றியலுகரம்: a final hard consonant + உ in a word that is not just
/// two short syllables (காடு, பாட்டு, அரசு — but not பசு, which keeps its உ).
fn is_kutriyalugaram(aksharas: &[&str]) -> bool {
    let Some(last) = aksharas.last() else {
        return false;
    };
    let mut chars = last.chars();
    let (Some(c), Some('ு'), None) = (chars.next(), chars.next(), chars.next()) else {
        return false;
    };
    if !tamil::is_vallinam(c) || aksharas.len() < 2 {
        return false;
    }
    !(aksharas.len() == 2 && tamil::is_short_syllable(aksharas[0]))
}

/// Front vowels (இ, ஈ, ஐ, ஏ) take the ய் glide; the rest take வ்.
fn glide_for(vowel: char) -> char {
    if matches!(vowel, 'இ' | 'ஈ' | 'ஐ' | 'ஏ') {
        'ய'
    } else {
        'வ'
    }
}

/// Words after which the next hard consonant doubles (சுட்டு, வினா).
const MIGU_DEMONSTRATIVES: [&str; 9] = [
    "அந்த",
    "இந்த",
    "எந்த",
    "அப்படி",
    "இப்படி",
    "எப்படி",
    "அங்கு",
    "இங்கு",
    "எங்கு",
];

// Internal rule engine — &str parameters, not exported via FFI
impl AdhanSandhi {
    /// Join two units (compound joining) and report the rule that applied.
    pub(crate) fn analyze(&self, word1: &str, word2: &str) -> SandhiResult {
        if word1.is_empty() || word2.is_empty() {
            return result(format!("{word1}{word2}"), SandhiRule::NoRule, 1.0);
        }

        let left = tamil::aksharas(word1);
        let last = *left.last().expect("non-empty word has an akshara");
        let stem = &word1[..word1.len() - last.len()];
        let last_class = tamil::classify(last);
        let last_char = last.chars().next().unwrap_or_default();
        let vowel_next = starts_with_vowel(word2);
        let hard_next = starts_with_vallinam(word2);

        // குற்றியலுகரம் கெடல்: காடு + அழகு → காடழகு
        if vowel_next && is_kutriyalugaram(&left) {
            return result(
                format!("{stem}{}", tamil::attach(last_char, word2)),
                SandhiRule::KutriyalugaramKedal,
                0.85,
            );
        }

        match last_class {
            // உடம்படுமெய்: பசி + இல்லை → பசியில்லை, திரு + அடி → திருவடி
            Akshara::Uyir | Akshara::UyirMei if vowel_next => {
                let vowel = tamil::final_vowel(last).unwrap_or('அ');
                let glide = glide_for(vowel);
                return result(
                    format!("{word1}{}", tamil::attach(glide, word2)),
                    SandhiRule::UdambaduMei,
                    0.9,
                );
            }
            // வல்லினம் மிகுதல் after ஐ, கு and long monosyllables:
            // வாழை + பழம் → வாழைப்பழம், பூ + கொடி → பூக்கொடி
            Akshara::Uyir | Akshara::UyirMei => {
                if let Some(c) = hard_next {
                    let vowel = tamil::final_vowel(last).unwrap_or('அ');
                    let migu = vowel == 'ஐ'
                        || last == "கு"
                        || MIGU_DEMONSTRATIVES.contains(&word1)
                        || (left.len() == 1 && tamil::is_nedil(vowel));
                    if migu {
                        return result(
                            format!("{word1}{c}{}{word2}", tamil::PULLI),
                            SandhiRule::VallinamMigu,
                            0.8,
                        );
                    }
                }
            }
            Akshara::Mei => {
                // தனிக்குறில் முன் ஒற்று உயிர்வரின் இரட்டும்: கல் + அடி → கல்லடி
                if vowel_next && is_short_closed_monosyllable(&left) {
                    return result(
                        format!("{word1}{}", tamil::attach(last_char, word2)),
                        SandhiRule::MeiMigu,
                        0.85,
                    );
                }
                // ம் + உயிர் → வ: மரம் + அடி → மரவடி
                if vowel_next && last_char == 'ம' {
                    return result(
                        format!("{stem}{}", tamil::attach('வ', word2)),
                        SandhiRule::MeiTiribu,
                        0.75,
                    );
                }
                // மெய் + உயிர் (இயல்பு): அவன் + அழகன் → அவனழகன்
                if vowel_next {
                    return result(
                        format!("{stem}{}", tamil::attach(last_char, word2)),
                        SandhiRule::IyalbuPunarchi,
                        0.9,
                    );
                }
                if let Some(c) = hard_next {
                    // ம் + வல்லினம்: மரம் + தோப்பு → மரத்தோப்பு
                    if last_char == 'ம' {
                        return result(
                            format!("{stem}{c}{}{word2}", tamil::PULLI),
                            SandhiRule::VallinamMigu,
                            0.8,
                        );
                    }
                    // ல்/ன் → ற், ள்/ண் → ட் (and a following த turns into the same):
                    // கல் + குடம் → கற்குடம், பொன் + கலம் → பொற்கலம், கல் + தூண் → கற்றூண்
                    // Limited to தனிக்குறில் monosyllables (கல், பொன், முள், மண்): in
                    // modern Tamil longer words keep their final (நான் போ, மீன்கடை).
                    let tiribu = match last_char {
                        _ if !is_short_closed_monosyllable(&left) => None,
                        'ல' | 'ன' => Some('ற'),
                        'ள' | 'ண' => Some('ட'),
                        _ => None,
                    };
                    if let Some(t) = tiribu {
                        let rest = if c == 'த' {
                            format!("{t}{}", &word2['த'.len_utf8()..])
                        } else {
                            word2.to_string()
                        };
                        return result(
                            format!("{stem}{t}{}{rest}", tamil::PULLI),
                            SandhiRule::MeiTiribu,
                            0.75,
                        );
                    }
                    // ய்/ர்/ழ் + வல்லினம்: நீர் + துளி → நீர்த்துளி, தமிழ் + சங்கம் → தமிழ்ச்சங்கம்
                    if matches!(last_char, 'ய' | 'ர' | 'ழ') {
                        return result(
                            format!("{word1}{c}{}{word2}", tamil::PULLI),
                            SandhiRule::VallinamMigu,
                            0.8,
                        );
                    }
                }
            }
            Akshara::Aytham | Akshara::Other => {}
        }

        result(format!("{word1}{word2}"), SandhiRule::IyalbuPunarchi, 0.6)
    }

    /// வல்லினம் மிகும் இடம் between two separate words: returns the corrected
    /// first word when the next word's hard consonant must be doubled onto it.
    /// பள்ளிக்கு + சென்றான் → Some("பள்ளிக்குச்"); நல்ல + பையன் → None.
    pub(crate) fn migu_between(&self, prev: &str, next: &str) -> Option<String> {
        let c = starts_with_vallinam(next)?;
        // ட and ற never start a word; ignore anything else odd.
        if !matches!(c, 'க' | 'ச' | 'த' | 'ப') {
            return None;
        }
        if prev.is_empty() || tamil::ends_with_pulli(prev) {
            return None;
        }
        let trigger = prev.ends_with('ை')            // 2nd case: பாடத்தைப் படி
            || prev.ends_with("கு")                    // 4th case: பள்ளிக்குச் செல்
            || prev.ends_with("ாக")                    // adverb: மெதுவாகச் செல்
            || prev.ends_with("க்க")                   // infinitive: படிக்கச் சென்றான்
            || MIGU_DEMONSTRATIVES.contains(&prev); // அந்தப் பையன்
        trigger.then(|| format!("{prev}{c}{}", tamil::PULLI))
    }
}

#[uniffi::export]
impl AdhanSandhi {
    #[uniffi::constructor]
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            corrections: std::sync::RwLock::new(Vec::new()),
        })
    }

    /// Join two words as a compound. Returns the joined form.
    pub fn check_punarchi(&self, word1: String, word2: String) -> String {
        self.analyze(&word1, &word2).output
    }

    /// Full analysis: returns joined output, rule applied, and confidence score.
    pub fn analyze_words(&self, word1: String, word2: String) -> SandhiResult {
        self.analyze(&word1, &word2)
    }

    /// Corrected first word when வல்லினம் must double between two separate words.
    pub fn migu_correction(&self, prev: String, next: String) -> Option<String> {
        self.migu_between(&prev, &next)
    }

    /// Record a user correction for future learning/training data export.
    pub fn record_correction(&self, word1: String, word2: String, expected: String) {
        let rule_applied = format!("{:?}", self.analyze(&word1, &word2).rule);
        self.corrections.write().unwrap().push(SandhiCorrection {
            word1,
            word2,
            expected,
            rule_applied,
        });
    }

    /// Get the number of recorded user corrections.
    pub fn get_corrections_count(&self) -> u32 {
        self.corrections.read().unwrap().len() as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Canonical joins. The first block mirrors Adhan's `SANDHI_CASES`
    /// (morphology_tests.py) so the two engines stay in step.
    const JOINS: &[(&str, &str, &str, SandhiRule)] = &[
        // — Adhan's table —
        ("பசி", "இல்லை", "பசியில்லை", SandhiRule::UdambaduMei),
        ("கை", "இல்லை", "கையில்லை", SandhiRule::UdambaduMei),
        ("பலா", "அடி", "பலாவடி", SandhiRule::UdambaduMei),
        ("திரு", "அடி", "திருவடி", SandhiRule::UdambaduMei),
        ("மரம்", "அடி", "மரவடி", SandhiRule::MeiTiribu),
        ("நீர்", "அளவு", "நீரளவு", SandhiRule::IyalbuPunarchi),
        ("தமிழ்", "அறிஞர்", "தமிழறிஞர்", SandhiRule::IyalbuPunarchi),
        ("மரம்", "தோப்பு", "மரத்தோப்பு", SandhiRule::VallinamMigu),
        ("நீர்", "துளி", "நீர்த்துளி", SandhiRule::VallinamMigu),
        ("கல்", "அடி", "கல்லடி", SandhiRule::MeiMigu),
        ("முள்", "அடி", "முள்ளடி", SandhiRule::MeiMigu),
        ("மண்", "அடி", "மண்ணடி", SandhiRule::MeiMigu),
        ("நெய்", "அப்பம்", "நெய்யப்பம்", SandhiRule::MeiMigu),
        // — cases the earlier engine got wrong —
        ("மண்", "அழகு", "மண்ணழகு", SandhiRule::MeiMigu),
        ("அவன்", "அழகன்", "அவனழகன்", SandhiRule::IyalbuPunarchi),
        ("மணி", "அடித்தது", "மணியடித்தது", SandhiRule::UdambaduMei),
        ("பல", "இடங்கள்", "பலவிடங்கள்", SandhiRule::UdambaduMei),
        ("நிலா", "ஒளி", "நிலாவொளி", SandhiRule::UdambaduMei),
        ("காடு", "அழகு", "காடழகு", SandhiRule::KutriyalugaramKedal),
        ("கல்", "குடம்", "கற்குடம்", SandhiRule::MeiTiribu),
        ("பொன்", "கலம்", "பொற்கலம்", SandhiRule::MeiTiribu),
        ("கல்", "தூண்", "கற்றூண்", SandhiRule::MeiTiribu),
        ("முள்", "செடி", "முட்செடி", SandhiRule::MeiTiribu),
        ("தமிழ்", "சங்கம்", "தமிழ்ச்சங்கம்", SandhiRule::VallinamMigu),
        ("வாழை", "பழம்", "வாழைப்பழம்", SandhiRule::VallinamMigu),
        ("பூ", "கொடி", "பூக்கொடி", SandhiRule::VallinamMigu),
        ("நல்ல", "பையன்", "நல்லபையன்", SandhiRule::IyalbuPunarchi),
        ("கல்", "மலை", "கல்மலை", SandhiRule::IyalbuPunarchi),
        ("மீன்", "கடை", "மீன்கடை", SandhiRule::IyalbuPunarchi),
        ("பசு", "அழகு", "பசுவழகு", SandhiRule::UdambaduMei),
    ];

    #[test]
    fn canonical_joins() {
        let s = AdhanSandhi::new();
        for (a, b, want, rule) in JOINS {
            let r = s.analyze(a, b);
            assert_eq!(r.output, *want, "{a} + {b}");
            assert_eq!(r.rule, *rule, "{a} + {b} → {}", r.output);
        }
    }

    #[test]
    fn never_emits_consonant_before_free_vowel() {
        let s = AdhanSandhi::new();
        for (a, b, _, _) in JOINS {
            let out = s.analyze(a, b).output;
            let chars: Vec<char> = out.chars().collect();
            for w in chars.windows(2) {
                let bad =
                    (tamil::is_consonant(w[0]) || tamil::is_pulli(w[0])) && tamil::is_uyir(w[1]);
                assert!(!bad, "malformed cluster in {out}");
            }
        }
    }

    #[test]
    fn migu_between_separate_words() {
        let s = AdhanSandhi::new();
        let yes = [
            ("பள்ளிக்கு", "சென்றான்", "பள்ளிக்குச்"),
            ("பாடத்தை", "படித்தான்", "பாடத்தைப்"),
            ("அந்த", "பையன்", "அந்தப்"),
            ("மெதுவாக", "கூறினான்", "மெதுவாகக்"),
            ("படிக்க", "சென்றான்", "படிக்கச்"),
        ];
        for (a, b, want) in yes {
            assert_eq!(s.migu_between(a, b).as_deref(), Some(want), "{a} {b}");
        }
        let no = [
            ("நல்ல", "பையன்"),
            ("நான்", "போனேன்"),
            ("பள்ளிக்குச்", "சென்றான்"),
            ("பள்ளிக்கு", "வந்தான்"),
            ("அவன்", "படித்தான்"),
        ];
        for (a, b) in no {
            assert_eq!(s.migu_between(a, b), None, "{a} {b}");
        }
    }

    #[test]
    fn test_empty_input() {
        let s = AdhanSandhi::new();
        assert_eq!(s.check_punarchi("".to_string(), "அம்மா".to_string()), "அம்மா");
        assert_eq!(s.check_punarchi("தமிழ்".to_string(), "".to_string()), "தமிழ்");
    }

    #[test]
    fn test_analyze_returns_confidence() {
        let s = AdhanSandhi::new();
        let r = s.analyze("நான்", "போ");
        assert!(r.confidence > 0.0 && r.confidence <= 1.0);
        assert_eq!(r.output, "நான்போ", "nasal finals take no migu");
    }

    #[test]
    fn test_correction_recording() {
        let s = AdhanSandhi::new();
        s.record_correction("பூ".to_string(), "கொடி".to_string(), "பூக்கொடி".to_string());
        assert_eq!(s.get_corrections_count(), 1);
    }
}
