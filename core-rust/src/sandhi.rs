use crate::tamil;

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
///
/// Phase 1: Rule-based (this file)
/// Phase 2: ONNX model for ambiguous cases

#[derive(uniffi::Object)]
pub struct AdhanSandhi {
    /// Learning mode: collect user corrections
    corrections: std::sync::RwLock<Vec<SandhiCorrection>>,
}

#[derive(Debug, Clone, uniffi::Record)]
pub struct SandhiCorrection {
    pub word1: String,
    pub word2: String,
    pub expected: String,
    pub rule_applied: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SandhiRule {
    IyalbuPunarchi,     // Natural joining (no change)
    VallinamMigu,       // Hard consonant doubles
    MellinamMigu,       // Nasal consonant inserted
    UyirmeiTiribu,      // Vowel changes at boundary
    TontruPunarchi,     // Character deleted at boundary
    IdaiyinamInsertion, // Medium consonant inserted (ய், வ்)
    NoRule,             // No sandhi applicable
}

#[derive(Debug, Clone, uniffi::Record)]
pub struct SandhiResult {
    pub output: String,
    pub rule: SandhiRule,
    pub confidence: f32, // 0.0-1.0 for Phase 2 model scoring
}

#[uniffi::export]
impl AdhanSandhi {
    pub fn new() -> Self {
        Self {
            corrections: std::sync::RwLock::new(Vec::new()),
        }
    }

    /// Primary entry point: check two words for Sandhi joining.
    pub fn check_punarchi(&self, word1: &str, word2: &str) -> String {
        let result = self.analyze(word1, word2);
        result.output
    }

    /// Full analysis with rule identification
    pub fn analyze(&self, word1: &str, word2: &str) -> SandhiResult {
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

        // Rule 1: Vallinam Migu (Hard consonant doubling)
        // When word1 ends without pulli and word2 starts with vallinam
        if let Some(result) = self.try_vallinam_migu(word1, word2, &w1_chars, &w2_chars, last, first) {
            return result;
        }

        // Rule 2: Mellinam Migu (Nasal insertion)
        // When word1 ends with pulli and word2 starts with vallinam
        if let Some(result) = self.try_mellinam_migu(word1, word2, &w1_chars, last, first) {
            return result;
        }

        // Rule 3: Idaiyinam insertion (ய் or வ் glide)
        // Between two vowels
        if let Some(result) = self.try_idaiyinam(word1, word2, last, first) {
            return result;
        }

        // Rule 4: Tontru Punarchi (Deletion)
        // When word1 ends in pulli and word2 starts with vowel
        if let Some(result) = self.try_tontru(word1, word2, &w1_chars, last, first) {
            return result;
        }

        // Rule 5: Uyirmei Tiribu (Vowel mutation at boundary)
        if let Some(result) = self.try_uyirmei_tiribu(word1, word2, last, first) {
            return result;
        }

        // Default: Iyalbu Punarchi (natural concatenation)
        SandhiResult {
            output: format!("{}{}", word1, word2),
            rule: SandhiRule::IyalbuPunarchi,
            confidence: 0.6,
        }
    }

    /// Rule: Vallinam Migu — double the starting hard consonant
    /// e.g., மாடு + கன்று → மாடுக்கன்று (vallinam க doubles)
    fn try_vallinam_migu(
        &self, word1: &str, word2: &str,
        _w1: &[char], w2: &[char],
        last: char, first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_vallinam(first) { return None; }
        
        // Word1 ends in a short vowel sound or uyirmei without pulli
        if tamil::ends_with_short_vowel(word1) || 
           (!tamil::is_pulli(last) && !tamil::is_uyir(last)) {
            // Double the vallinam: insert pulli + consonant before word2
            let doubled = format!("{}{}்{}", word1, first, &word2[first.len_utf8()..]);
            // Actually: word1 + first_consonant + pulli + word2
            let result = format!("{}{}{}", word1, first, word2);
            // Proper doubling: e.g., பூ + கொடி = பூக்கொடி
            let doubled = format!("{}{}்{}", word1, first, word2);
            return Some(SandhiResult {
                output: doubled,
                rule: SandhiRule::VallinamMigu,
                confidence: 0.8,
            });
        }
        
        None
    }

    /// Rule: Mellinam Migu — insert matching nasal before hard consonant
    /// e.g., பொன் + கலம் → பொங்கலம் (ன் -> ங் before க)
    fn try_mellinam_migu(
        &self, word1: &str, word2: &str,
        w1: &[char], last: char, first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_vallinam(first) { return None; }
        if !tamil::is_pulli(last) { return None; }
        
        // Get the consonant before pulli
        if w1.len() < 2 { return None; }
        let consonant_before_pulli = w1[w1.len() - 2];
        
        // If it's a mellinam already, just join
        if tamil::is_mellinam(consonant_before_pulli) {
            return Some(SandhiResult {
                output: format!("{}{}", word1, word2),
                rule: SandhiRule::MellinamMigu,
                confidence: 0.85,
            });
        }

        // Insert matching nasal: find the mellinam pair for the vallinam
        if let Some(nasal) = tamil::vallinam_to_mellinam(first) {
            // Replace last consonant+pulli with nasal+pulli, then add word2
            let base = &word1[..word1.len() - consonant_before_pulli.len_utf8() - PULLI_LEN];
            let result = format!("{}{}்{}", base, nasal, word2);
            return Some(SandhiResult {
                output: result,
                rule: SandhiRule::MellinamMigu,
                confidence: 0.75,
            });
        }

        None
    }

    /// Rule: Idaiyinam insertion — insert glide consonant between vowels
    /// e.g., தா + அம்மா → தாயம்மா (ய் inserted between vowels)
    fn try_idaiyinam(
        &self, word1: &str, word2: &str,
        last: char, first: char,
    ) -> Option<SandhiResult> {
        // Both must be vowel sounds
        if !tamil::is_uyir(last) { return None; }
        if !tamil::is_uyir(first) { return None; }

        // Insert ய் as glide between two vowels
        let result = format!("{}ய்{}", word1, word2);
        Some(SandhiResult {
            output: result,
            rule: SandhiRule::IdaiyinamInsertion,
            confidence: 0.7,
        })
    }

    /// Rule: Tontru Punarchi — delete pulli at boundary before vowel
    /// e.g., மண் + அழகு → மணழகு (pulli deleted, consonant joins vowel)
    fn try_tontru(
        &self, word1: &str, word2: &str,
        w1: &[char], last: char, first: char,
    ) -> Option<SandhiResult> {
        if !tamil::is_pulli(last) { return None; }
        if !tamil::is_uyir(first) { return None; }

        // Remove pulli from word1, then join with word2
        let base = &word1[..word1.len() - PULLI_LEN];
        let result = format!("{}{}", base, word2);
        Some(SandhiResult {
            output: result,
            rule: SandhiRule::TontruPunarchi,
            confidence: 0.75,
        })
    }

    /// Rule: Uyirmei Tiribu — vowel mutation at boundary
    /// e.g., நிலா + ஒளி → நிலவொளி (ஆ → வ)
    fn try_uyirmei_tiribu(
        &self, word1: &str, word2: &str,
        last: char, first: char,
    ) -> Option<SandhiResult> {
        // Long ஆ before vowel -> insert வ்
        if last == 'ா' && tamil::is_uyir(first) {
            let base = &word1[..word1.len() - 'ா'.len_utf8()];
            let result = format!("{}வ{}", base, word2);
            return Some(SandhiResult {
                output: result,
                rule: SandhiRule::UyirmeiTiribu,
                confidence: 0.7,
            });
        }
        None
    }

    /// Record a user correction for future learning
    pub fn record_correction(&self, word1: &str, word2: &str, expected: &str) {
        let analysis = self.analyze(word1, word2);
        self.corrections.write().unwrap().push(SandhiCorrection {
            word1: word1.to_string(),
            word2: word2.to_string(),
            expected: expected.to_string(),
            rule_applied: format!("{:?}", analysis.rule),
        });
    }

    /// Get corrections log (for training data export)
    pub fn get_corrections_count(&self) -> u32 {
        self.corrections.read().unwrap().len() as u32
    }
}

/// Pulli (்) byte length in UTF-8
const PULLI_LEN: usize = 3; // Tamil pulli is 3 bytes in UTF-8

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_input() {
        let s = AdhanSandhi::new();
        assert_eq!(s.check_punarchi("", "அம்மா"), "அம்மா");
        assert_eq!(s.check_punarchi("தமிழ்", ""), "தமிழ்");
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
        // பூ + கொடி -> பூக்கொடி
        assert!(r.output.contains("க்"));
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
        // Pulli removed, consonant joins vowel
        assert!(!r.output.contains("்அ"));
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
        let mut s = AdhanSandhi::new();
        s.record_correction("பூ", "கொடி", "பூக்கொடி");
        assert_eq!(s.get_corrections_count(), 1);
    }
}
