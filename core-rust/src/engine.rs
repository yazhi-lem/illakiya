use crate::layout::LayoutDef;
use crate::dictionary::Dictionary;
use crate::sandhi::AdhanSandhi;
use std::sync::Arc;

#[derive(uniffi::Object)]
pub struct KeyboardEngine {
    layout: LayoutDef,
    dict: Arc<Dictionary>,
    sandhi: Arc<AdhanSandhi>,
    state: std::sync::RwLock<EngineState>,
}

struct EngineState {
    buffer: String,
    pending_consonant: Option<String>,
    nedil_active: bool,
    words: Vec<String>,
    current_word: String,
}

// Private helpers — not exported via FFI
impl KeyboardEngine {
    fn handle_vowel(&self, state: &mut EngineState, vowel: &str) -> String {
        if let Some(consonant) = state.pending_consonant.take() {
            if let Some(combined) = self.layout.combine(&consonant, vowel) {
                state.buffer.push_str(combined);
                state.current_word.push_str(combined);
                combined.clone()
            } else {
                state.buffer.push_str(&consonant);
                state.buffer.push_str(vowel);
                state.current_word.push_str(&consonant);
                state.current_word.push_str(vowel);
                format!("{}{}", consonant, vowel)
            }
        } else {
            state.buffer.push_str(vowel);
            state.current_word.push_str(vowel);
            vowel.to_string()
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
                if !state.current_word.is_empty() {
                    self.dict.record_usage_str(&state.current_word);
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
                // Inline reset: avoids re-locking self.state (deadlock)
                state.buffer.clear();
                state.pending_consonant = None;
                state.nedil_active = false;
                state.words.clear();
                state.current_word.clear();
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
}

#[uniffi::export]
impl KeyboardEngine {
    #[uniffi::constructor]
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
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
        })
    }

    pub fn toggle_nedil(&self) {
        self.state.write().unwrap().nedil_active ^= true;
    }

    pub fn process_input(&self, key: String) -> String {
        let mut state = self.state.write().unwrap();

        let vowel = self.layout.any_vowel_lookup(&key, state.nedil_active).cloned();
        if state.nedil_active {
            state.nedil_active = false;
        }

        if let Some(vowel) = vowel {
            return self.handle_vowel(&mut state, &vowel);
        }

        if let Some(consonant) = self.layout.base_lookup(&key).cloned() {
            return self.handle_consonant(&mut state, &consonant);
        }

        self.handle_special(&mut state, &key)
    }

    pub fn get_suggestions(&self, limit: u32) -> Vec<String> {
        let state = self.state.read().unwrap();
        if state.current_word.is_empty() && state.pending_consonant.is_none() {
            return Vec::new();
        }
        let mut prefix = state.current_word.clone();
        if let Some(ref pending) = state.pending_consonant {
            prefix.push_str(pending);
        }
        self.dict.suggest_prefix(&prefix, limit)
    }

    pub fn get_sandhi_suggestion(&self) -> Option<String> {
        let state = self.state.read().unwrap();
        let last_word = state.words.last()?;
        if state.current_word.is_empty() {
            return None;
        }
        let result = self.sandhi.analyze(last_word, &state.current_word);
        if result.rule != crate::sandhi::SandhiRule::IyalbuPunarchi
            && result.rule != crate::sandhi::SandhiRule::NoRule
            && result.confidence > 0.6
        {
            Some(result.output)
        } else {
            None
        }
    }

    pub fn accept_suggestion(&self, suggestion: String) -> String {
        let mut state = self.state.write().unwrap();
        let current_len = state.current_word.len();
        let buf_len = state.buffer.len();
        if buf_len >= current_len {
            state.buffer.truncate(buf_len - current_len);
        }
        state.buffer.push_str(&suggestion);
        state.current_word = suggestion.clone();
        state.pending_consonant = None;
        self.dict.record_usage_str(&suggestion);
        suggestion
    }

    pub fn is_valid_word(&self, word: String) -> bool {
        self.dict.contains_str(&word)
    }

    pub fn translate_current(&self) -> Option<String> {
        let state = self.state.read().unwrap();
        if state.current_word.is_empty() {
            return None;
        }
        self.dict.translate_str(&state.current_word)
    }

    pub fn get_buffer(&self) -> String {
        let state = self.state.read().unwrap();
        let mut buf = state.buffer.clone();
        if let Some(ref pending) = state.pending_consonant {
            buf.push_str(pending);
        }
        buf
    }

    pub fn get_pending(&self) -> Option<String> {
        self.state.read().unwrap().pending_consonant.clone()
    }

    pub fn get_current_word(&self) -> String {
        let state = self.state.read().unwrap();
        let mut word = state.current_word.clone();
        if let Some(ref pending) = state.pending_consonant {
            word.push_str(pending);
        }
        word
    }

    pub fn is_nedil_active(&self) -> bool {
        self.state.read().unwrap().nedil_active
    }

    pub fn dictionary_size(&self) -> u32 {
        self.dict.word_count()
    }

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
        assert_eq!(eng.process_input("z".to_string()), "அ");
    }

    #[test]
    fn test_consonant_then_vowel() {
        let eng = KeyboardEngine::new();
        assert_eq!(eng.process_input("q".to_string()), "");
        assert_eq!(eng.process_input("z".to_string()), "க");
    }

    #[test]
    fn test_long_vowel_nedil() {
        let eng = KeyboardEngine::new();
        eng.process_input("q".to_string());
        eng.process_input("nedil".to_string());
        assert_eq!(eng.process_input("z".to_string()), "கா");
    }

    #[test]
    fn test_suggestions() {
        let eng = KeyboardEngine::new();
        eng.process_input("u".to_string()); // த்
        eng.process_input("z".to_string()); // த
        eng.process_input("p".to_string()); // ம்
        eng.process_input("x".to_string()); // மி
        let suggestions = eng.get_suggestions(5);
        assert!(
            suggestions.iter().any(|s| s.contains("தமிழ")),
            "Expected suggestion containing 'தமிழ', got: {:?}",
            suggestions
        );
    }

    #[test]
    fn test_word_boundary_tracking() {
        let eng = KeyboardEngine::new();
        eng.process_input("z".to_string()); // அ
        eng.process_input(" ".to_string()); // space -> word boundary
        let state = eng.state.read().unwrap();
        assert_eq!(state.words.len(), 1);
        assert_eq!(state.words[0], "அ");
        assert!(state.current_word.is_empty());
    }

    #[test]
    fn test_dictionary_lookup() {
        let eng = KeyboardEngine::new();
        assert!(eng.is_valid_word("நான்".to_string()));
        assert!(!eng.is_valid_word("abcdef".to_string()));
    }

    #[test]
    fn test_current_word_tracking() {
        let eng = KeyboardEngine::new();
        eng.process_input("u".to_string()); // த்
        eng.process_input("z".to_string()); // த committed
        assert_eq!(eng.get_current_word(), "த");
        eng.process_input("p".to_string()); // ம் pending
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
        eng.process_input("u".to_string()); // த்
        eng.process_input("z".to_string()); // த
        let result = eng.accept_suggestion("தமிழ்".to_string());
        assert_eq!(result, "தமிழ்");
        assert_eq!(eng.get_current_word(), "தமிழ்");
    }

    #[test]
    fn test_clear_resets_state() {
        let eng = KeyboardEngine::new();
        eng.process_input("z".to_string()); // அ
        eng.process_input("q".to_string()); // க் pending
        eng.process_input("clear".to_string());
        assert_eq!(eng.get_buffer(), "");
        assert_eq!(eng.get_current_word(), "");
        assert!(eng.get_pending().is_none());
    }

    #[test]
    fn test_full_sentence() {
        let eng = KeyboardEngine::new();
        eng.process_input("i".to_string()); // ந்
        eng.process_input("z".to_string()); // ந
        let buf = eng.get_buffer();
        assert!(!buf.is_empty());
    }
}
