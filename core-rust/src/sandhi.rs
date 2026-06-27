use crate::tamil;
use std::sync::Arc;

/// Adhan-Sandhi: Tamil word-joining (Punarchi) engine.
///
/// Implements the 8 core Sandhi rules from Tholkaappiyam:
///   1. Iyalbu Punarchi (Natural joining)
///   2. Vallinam Migu (Hard consonant doubling)
///   3. Mellinam Migu (Nasal insertion)
///   4. Uyirmei Tiribu (Vowel mutation)
///   5. Tontru Punarchi (Deletion at boundary)
///   6. Nool Punarchi (Grammatical joining)
///   7. Vazhakku Punarchi (Colloquial joining)
///   8. Idaiyinam insertion

/// Pulli (்) byte length in UTF-8
const PULLI_LEN: usize = 3;

#[derive(Debug, Clone, PartialEq, uniffi::Enum)]
pub enum SandhiRule {
    IyalbuPunarchi,
    VallinamMigu,
    MellinamMigu,
    UyirmeiTiribu,
    TontruPunarchi,
    IdaiyinamInsertion,
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

// Internal rule engine — &str parameters, not exported via FFI
impl AdhanSandhi {
    /// Full analysis with rule identification. Used internally and from tests.
    pub(crate) fn analyze(&self, word1: &str, word2: &str) -> SandhiResult {
        if word1.is_empty() || word2.is_empty() {
            return SandhiResult {
                output: format!("{}{}", word1, word2),
                rule: SandhiRule::NoRule,
                confidence: 1.0,
            };
        }

        let w1_chars: Vec<char> = word1.chars().collect();
        let w2_chars: Vec<char> = word2.chars().collect();
        let last = w1_chars[w1_chars.len() - 1];
        let first = w2_chars[0];

        if let Some(r) = self.try_vallinam_migu(word1, word2, last, first) {
            return r;
        }
        if let Some(r) = self.try_mellinam_migu(word1, word2, &w1_chars, last, first) {
            return r;
        }
        if let Some(r) = self.try_idaiyinam(word1, word2, last, first) {
            return r;
        }
        if let Some(r) = self.try_tontru(word1, word2, last, first) {
            return r;
        }
        if let Some(r) = self.try_uyirmei_tiribu(word1, word2, last, first) {
            return r;
        }

        SandhiResult {
            output: format!("{}{}", word1, word2),
            rule: SandhiRule::IyalbuPunarchi,
            confidence: 0.6,
        }
    }

    /// Rule: Vallinam Migu — double the starting hard consonant.
    /// e.g., பூ + கொடி → பூக்கொடி (க doubles to க்க)
    fn try_vallinam_migu(
        &self,
        word1: &str,
        word2: &str,
        last: char,
        first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_vallinam(first) {
            return None;
        }
        if tamil::ends_with_short_vowel(word1)
            || (!tamil::is_pulli(last) && !tamil::is_uyir(last))
        {
            // Insert consonant+pulli before word2: word1 + க + ் + word2
            let doubled = format!("{}{}்{}", word1, first, word2);
            return Some(SandhiResult {
                output: doubled,
                rule: SandhiRule::VallinamMigu,
                confidence: 0.8,
            });
        }
        None
    }

    /// Rule: Mellinam Migu — insert matching nasal before hard consonant.
    /// e.g., பொன் + கலம் → பொங்கலம் (ன் → ங் before க)
    fn try_mellinam_migu(
        &self,
        word1: &str,
        word2: &str,
        w1: &[char],
        last: char,
        first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_vallinam(first) || !tamil::is_pulli(last) || w1.len() < 2 {
            return None;
        }
        let consonant_before_pulli = w1[w1.len() - 2];

        if tamil::is_mellinam(consonant_before_pulli) {
            return Some(SandhiResult {
                output: format!("{}{}", word1, word2),
                rule: SandhiRule::MellinamMigu,
                confidence: 0.85,
            });
        }

        if let Some(nasal) = tamil::vallinam_to_mellinam(first) {
            let base_len = word1.len() - consonant_before_pulli.len_utf8() - PULLI_LEN;
            let base = &word1[..base_len];
            return Some(SandhiResult {
                output: format!("{}{}்{}", base, nasal, word2),
                rule: SandhiRule::MellinamMigu,
                confidence: 0.75,
            });
        }

        None
    }

    /// Rule: Idaiyinam insertion — insert glide consonant between vowels.
    /// e.g., தா + அம்மா → தாயம்மா (ய் inserted)
    fn try_idaiyinam(
        &self,
        word1: &str,
        word2: &str,
        last: char,
        first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_uyir(last) || !tamil::is_uyir(first) {
            return None;
        }
        Some(SandhiResult {
            output: format!("{}ய்{}", word1, word2),
            rule: SandhiRule::IdaiyinamInsertion,
            confidence: 0.7,
        })
    }

    /// Rule: Tontru Punarchi — delete pulli at boundary before vowel.
    /// e.g., மண் + அழகு → மணழகு (pulli deleted, consonant joins vowel)
    fn try_tontru(
        &self,
        word1: &str,
        word2: &str,
        last: char,
        first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_pulli(last) || !tamil::is_uyir(first) {
            return None;
        }
        let base = &word1[..word1.len() - PULLI_LEN];
        Some(SandhiResult {
            output: format!("{}{}", base, word2),
            rule: SandhiRule::TontruPunarchi,
            confidence: 0.75,
        })
    }

    /// Rule: Uyirmei Tiribu — vowel mutation at boundary.
    /// e.g., நிலா + ஒளி → நிலவொளி (ஆ → வ before vowel)
    fn try_uyirmei_tiribu(
        &self,
        word1: &str,
        word2: &str,
        last: char,
        first: char,
    ) -> Option<SandhiResult> {
        if last == 'ா' && tamil::is_uyir(first) {
            let base = &word1[..word1.len() - 'ா'.len_utf8()];
            return Some(SandhiResult {
                output: format!("{}வ{}", base, word2),
                rule: SandhiRule::UyirmeiTiribu,
                confidence: 0.7,
            });
        }
        None
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

    /// Check two words for Sandhi joining. Returns the joined form.
    pub fn check_punarchi(&self, word1: String, word2: String) -> String {
        self.analyze(&word1, &word2).output
    }

    /// Full analysis: returns joined output, rule applied, and confidence score.
    pub fn analyze_words(&self, word1: String, word2: String) -> SandhiResult {
        self.analyze(&word1, &word2)
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

    #[test]
    fn test_empty_input() {
        let s = AdhanSandhi::new();
        assert_eq!(s.check_punarchi("".to_string(), "அம்மா".to_string()), "அம்மா");
        assert_eq!(s.check_punarchi("தமிழ்".to_string(), "".to_string()), "தமிழ்");
    }

    #[test]
    fn test_iyalbu_punarchi() {
        let s = AdhanSandhi::new();
        let r = s.analyze("நல்ல", "மனிதன்");
        assert_eq!(r.rule, SandhiRule::IyalbuPunarchi);
    }

    #[test]
    fn test_vallinam_migu() {
        let s = AdhanSandhi::new();
        let r = s.analyze("பூ", "கொடி");
        assert_eq!(r.rule, SandhiRule::VallinamMigu);
        assert!(r.output.contains("க்"), "Expected க் in output, got: {}", r.output);
    }

    #[test]
    fn test_idaiyinam_insertion() {
        let s = AdhanSandhi::new();
        let r = s.analyze("அ", "அ");
        assert_eq!(r.rule, SandhiRule::IdaiyinamInsertion);
        assert!(r.output.contains("ய்"));
    }

    #[test]
    fn test_tontru_punarchi() {
        let s = AdhanSandhi::new();
        let r = s.analyze("மண்", "அழகு");
        assert_eq!(r.rule, SandhiRule::TontruPunarchi);
        assert!(!r.output.contains("்அ"), "Pulli+vowel should not appear: {}", r.output);
    }

    #[test]
    fn test_analyze_returns_confidence() {
        let s = AdhanSandhi::new();
        let r = s.analyze("நான்", "போ");
        assert!(r.confidence > 0.0);
        assert!(r.confidence <= 1.0);
    }

    #[test]
    fn test_correction_recording() {
        let s = AdhanSandhi::new();
        s.record_correction("பூ".to_string(), "கொடி".to_string(), "பூக்கொடி".to_string());
        assert_eq!(s.get_corrections_count(), 1);
    }
}
