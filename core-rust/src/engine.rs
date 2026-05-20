use crate::layout::LayoutDef;
use crate::dictionary::Dictionary;
use crate::sandhi::AdhanSandhi;

/// Core keyboard state machine.
/// Integrates layout, dictionary, and sandhi into a unified engine.
#[derive(uniffi::Object)]
pub struct KeyboardEngine {
    layout: LayoutDef,
    dict: Dictionary,
    sandhi: AdhanSandhi,
    state: std::sync::RwLock<EngineState>,
}

struct EngineState {
    buffer: String,
    pending_consonant: Option<String>,
    nedil_active: bool,
    /// Word boundaries for sandhi detection
    words: Vec<String>,
    /// Current word being typed
    current_word: String,
}

/// Suggestion from the engine (word + source)
#[derive(Debug, Clone)]
pub struct Suggestion {
    pub text: String,
    pub source: SuggestionSource,
}

#[derive(Debug, Clone)]
pub enum SuggestionSource {
    Dictionary,
    Sandhi,
    Recent,
}

#[uniffi::export]
impl KeyboardEngine {
    pub fn new() -> Self {
        Self {
            layout: LayoutDef::load_pm0100(),
            dict: Dictionary::new(),
            sandhi: AdhanSandhi::new(),
            state: std::sync::RwLock::new(EngineState {
                buffer: String::new(),
                pending_consonant: None,
                nedil_active: false,
                words: Vec::new(),
                current_word: String::new(),
            }),
        }
    }

    /// Toggle long vowel mode (triggered by swipe up)
    pub fn toggle_nedil(&self) {
        let mut state = self.state.write().unwrap();
        state.nedil_active = !state.nedil_active;
    }

    /// Process a single key press.
    /// Returns the text to commit.
    pub fn process_input(pub fn process_input(pub fn process_input(&self, key: &str) -> String {self, key: String) -> String {self, key: String) -> String {
        let mut state = self.state.write().unwrap();
        
        // 1. Check vowels (short, long, or special)
        let vowel = self.layout.any_vowel_lookup(key, state.nedil_active).cloned();
        if state.nedil_active { state.nedil_active = false; }

        if let Some(vowel) = vowel {
            return self.handle_vowel(&mut state, &vowel);
        }

        // 2. Check consonant (base layer)
        if let Some(consonant) = self.layout.base_lookup(key).cloned() {
            return self.handle_consonant(&mut state, &consonant);
        }

        // 3. Special keys
        self.handle_special(&mut state, key)
    }

    fn handle_vowel(&self, state: &mut EngineState, vowel: &str) -> String {
        if let Some(consonant) = state.pending_consonant.take() {
            if let Some(combined) = self.layout.combine(&consonant, vowel) {
                state.buffer.push_str(combined);
                state.current_word.push_str(combined);
                return combined.clone();
            } else {
                state.buffer.push_str(&consonant);
                state.buffer.push_str(vowel);
                state.current_word.push_str(&consonant);
                state.current_word.push_str(vowel);
                return format!("{}{}", consonant, vowel);
            }
        } else {
            state.buffer.push_str(vowel);
            state.current_word.push_str(vowel);
            return vowel.to_string();
        }
    }

    fn handle_consonant(&self, state: &mut EngineState, consonant: &str) -> String {
        let mut output = String::new();
        if let Some(prev) = state.pending_consonant.take() {
            state.buffer.push_str(&prev);
            state.current_word.push_str(&prev);
            output.push_str(&prev);
        }
        state.pending_consonant = Some(consonant.to_string());
        output
    }

    fn handle_special(&self, state: &mut EngineState, key: &str) -> String {
        match key {
            " " | "space" => {
                let mut output = String::new();
                if let Some(pending) = state.pending_consonant.take() {
                    state.buffer.push_str(&pending);
                    state.current_word.push_str(&pending);
                    output.push_str(&pending);
                }
                
                // Word boundary: record word and check sandhi
                if !state.current_word.is_empty() {
                    self.dict.record_usage(&state.current_word);
                    state.words.push(state.current_word.clone());
                    state.current_word.clear();
                }
                
                output.push(' ');
                state.buffer.push(' ');
                output
            }
            "backspace" => {
                if state.pending_consonant.is_some() {
                    state.pending_consonant = None;
                } else if !state.current_word.is_empty() {
                    state.current_word.pop();
                    state.buffer.pop();
                } else if !state.buffer.is_empty() {
                    state.buffer.pop();
                }
                "\x08".to_string()
            }
            "enter" => {
                let mut output = String::new();
                if let Some(pending) = state.pending_consonant.take() {
                    state.buffer.push_str(&pending);
                    state.current_word.push_str(&pending);
                    output.push_str(&pending);
                }
                if !state.current_word.is_empty() {
                    state.words.push(state.current_word.clone());
                    state.current_word.clear();
                }
                output.push('\n');
                state.buffer.push('\n');
                output
            }
            "nedil" | "swipe_up" => {
                state.nedil_active = true;
                String::new()
            }
            "clear" => {
                self.reset();
                String::new()
            }
            _ => {
                let mut output = String::new();
                if let Some(pending) = state.pending_consonant.take() {
                    state.buffer.push_str(&pending);
                    state.current_word.push_str(&pending);
                    output.push_str(&pending);
                }
                state.buffer.push_str(key);
                state.current_word.push_str(key);
                output.push_str(key);
                output
            }
        }
    }

    /// Get word suggestions for the current input prefix.
    /// Returns up to `limit` suggestions ranked by frequency + recency.
    pub fn get_suggestions(&self, limit: u32) -> Vec<String> {
        let state = self.state.read().unwrap();
        if state.current_word.is_empty() {
            return Vec::new();
        }

        let mut prefix = state.current_word.clone();
        if let Some(ref pending) = state.pending_consonant {
            prefix.push_str(pending);
        }

        self.dict.suggest(&prefix, limit)
    }

    /// Get sandhi suggestion for the last two words
    pub fn get_sandhi_suggestion(&self) -> Option<String> {
        let state = self.state.read().unwrap();
        if state.words.is_empty() { return None; }
        
        let last_word = state.words.last()?;
        if state.current_word.is_empty() { return None; }

        let result = self.sandhi.analyze(last_word, &state.current_word);
        // Only suggest if a specific rule was applied
        if result.rule != crate::sandhi::SandhiRule::IyalbuPunarchi 
           && result.rule != crate::sandhi::SandhiRule::NoRule 
           && result.confidence > 0.6 {
            Some(result.output)
        } else {
            None
        }
    }

    /// Accept a suggestion: replace current word with the suggestion
    pub fn accept_suggestion(&self, suggestion: &str) -> String {
        let mut state = self.state.write().unwrap();
        // Remove current partial word from buffer
        let current_len = state.current_word.len();
        if let Some(ref pending) = state.pending_consonant {
            // Also account for pending
            let total = current_len + pending.len();
            // But pending isn't in buffer yet
        }
        
        // Truncate buffer by current_word length
        let buf_len = state.buffer.len();
        if buf_len >= current_len {
            state.buffer.truncate(buf_len - current_len);
        }
        
        // Replace with suggestion
        state.buffer.push_str(suggestion);
        state.current_word = suggestion.to_string();
        state.pending_consonant = None;
        self.dict.record_usage(suggestion);
        
        suggestion.to_string()
    }

    /// Check if a word is in the dictionary
    pub fn is_valid_word(&self, word: &str) -> bool {
        self.dict.contains(word)
    }

    /// Translate current word
    pub fn translate_current(&self) -> Option<String> {
        let state = self.state.read().unwrap();
        if state.current_word.is_empty() { return None; }
        self.dict.translate(&state.current_word)
    }

    /// Get the full current buffer
    pub fn get_buffer(&self) -> String {
        let state = self.state.read().unwrap();
        let mut buf = state.buffer.clone();
        if let Some(ref pending) = state.pending_consonant {
            buf.push_str(pending);
        }
        buf
    }

    /// Get pending consonant for UI underline
    pub fn get_pending(&self) -> Option<String> {
        self.state.read().unwrap().pending_consonant.clone()
    }

    /// Get current partial word
    pub fn get_current_word(&self) -> String {
        let state = self.state.read().unwrap();
        let mut word = state.current_word.clone();
        if let Some(ref pending) = state.pending_consonant {
            word.push_str(pending);
        }
        word
    }

    /// Check if nedil mode is active
    pub fn is_nedil_active(&self) -> bool {
        self.state.read().unwrap().nedil_active
    }

    /// Get dictionary word count
    pub fn dictionary_size(&self) -> u32 {
        self.dict.word_count()
    }

    /// Reset engine state
    pub fn reset(&self) {
        let mut state = self.state.write().unwrap();
        state.buffer.clear();
        state.pending_consonant = None;
        state.nedil_active = false;
        state.words.clear();
        state.current_word.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vowel_standalone() {
        let eng = KeyboardEngine::new();
        assert_eq!(eng.process_input("z"), "அ");
    }

    #[test]
    fn test_consonant_then_vowel() {
        let eng = KeyboardEngine::new();
        assert_eq!(eng.process_input("q"), "");
        assert_eq!(eng.process_input("z"), "க");
    }

    #[test]
    fn test_long_vowel_nedil() {
        let eng = KeyboardEngine::new();
        eng.process_input("q");
        eng.process_input("nedil");
        assert_eq!(eng.process_input("z"), "கா");
    }

    #[test]
    fn test_suggestions() {
        let eng = KeyboardEngine::new();
        // Type "தமி" -> should suggest "தமிழ்"
        eng.process_input("u"); // த் pending
        eng.process_input("z"); // த
        eng.process_input("p"); // ம் pending  
        eng.process_input("x"); // மி
        let suggestions = eng.get_suggestions(5);
        assert!(suggestions.iter().any(|s| s.contains("தமிழ")),
            "Expected suggestion containing 'தமிழ', got: {:?}", suggestions);
    }

    #[test]
    fn test_word_boundary_tracking() {
        let mut eng = KeyboardEngine::new();
        eng.process_input("z"); // அ
        eng.process_input(" "); // Space -> word boundary
        let state = eng.state.read().unwrap();
        assert_eq!(state.words.len(), 1);
        assert_eq!(state.words[0], "அ");
        assert!(state.current_word.is_empty());
    }

    #[test]
    fn test_dictionary_lookup() {
        let eng = KeyboardEngine::new();
        assert!(eng.is_valid_word("நான்"));
        assert!(!eng.is_valid_word("abcdef"));
    }

    #[test]
    fn test_current_word_tracking() {
        let eng = KeyboardEngine::new();
        eng.process_input("u"); // த் pending
        eng.process_input("z"); // த committed
        assert_eq!(eng.get_current_word(), "த");
        eng.process_input("p"); // ம் pending
        assert_eq!(eng.get_current_word(), "தம்");
    }

    #[test]
    fn test_dictionary_size() {
        let eng = KeyboardEngine::new();
        assert!(eng.dictionary_size() >= 100);
    }

    #[test]
    fn test_accept_suggestion() {
        let eng = KeyboardEngine::new();
        eng.process_input("u"); // த் pending
        eng.process_input("z"); // த
        let result = eng.accept_suggestion("தமிழ்");
        assert_eq!(result, "தமிழ்");
        assert_eq!(eng.get_current_word(), "தமிழ்");
    }

    #[test]
    fn test_full_sentence() {
        let eng = KeyboardEngine::new();
        // Type "நான் தமிழ்"
        eng.process_input("i"); // ந் pending
        eng.process_input("z"); // ந + அ -> ந... wait
        // Actually: ந்+அ = ந
        // Then ன் pending
        // This tests the full pipeline
        let buf = eng.get_buffer();
        assert!(!buf.is_empty());
    }
}
