use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize, Clone)]
pub struct LayoutDef {
    pub name: String,
    pub version: String,
    pub total_characters: u32,
    pub layers: Layers,
    pub modifiers: Modifiers,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Layers {
    pub base: HashMap<String, String>,
    pub vowels: HashMap<String, String>,
    pub vowels_long: HashMap<String, String>,
    pub vowels_special: HashMap<String, String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Modifiers {
    pub nedil_shift: String,
    pub combinations: HashMap<String, String>,
}

impl LayoutDef {
    /// Load layout from embedded JSON string (zero filesystem dependency)
    pub fn load_pm0100() -> Self {
        let json = include_str!("../../data/layouts/pm0100.json");
        serde_json::from_str(json).expect("Invalid pm0100.json")
    }

    /// Lookup a key in the base consonant layer
    pub fn base_lookup(&self, key: &str) -> Option<&String> {
        self.layers.base.get(key)
    }

    /// Lookup a short vowel
    pub fn vowel_lookup(&self, key: &str) -> Option<&String> {
        self.layers.vowels.get(key)
    }

    /// Lookup a long vowel (nedil - swipe up)
    pub fn vowel_long_lookup(&self, key: &str) -> Option<&String> {
        self.layers.vowels_long.get(key)
    }

    /// Lookup a special vowel (ai, au)
    pub fn vowel_special_lookup(&self, key: &str) -> Option<&String> {
        self.layers.vowels_special.get(key)
    }

    /// Resolve any vowel from all layers
    pub fn any_vowel_lookup(&self, key: &str, is_long: bool) -> Option<&String> {
        if is_long {
            self.vowel_long_lookup(key)
        } else {
            self.vowel_lookup(key)
                .or_else(|| self.vowel_special_lookup(key))
        }
    }

    /// Attempt consonant+vowel combination (216 entries)
    pub fn combine(&self, consonant: &str, vowel: &str) -> Option<&String> {
        let combo_key = format!("{}+{}", consonant, vowel);
        self.modifiers.combinations.get(&combo_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_pm0100() {
        let layout = LayoutDef::load_pm0100();
        assert_eq!(layout.name, "pm0100");
        assert_eq!(layout.total_characters, 247);
        assert_eq!(layout.modifiers.combinations.len(), 216);
    }

    #[test]
    fn test_all_consonants_present() {
        let layout = LayoutDef::load_pm0100();
        assert_eq!(layout.layers.base.len(), 19); // 18 mei + ayutham
    }

    #[test]
    fn test_combine_ka() {
        let layout = LayoutDef::load_pm0100();
        assert_eq!(layout.combine("க்", "அ").unwrap(), "க");
        assert_eq!(layout.combine("க்", "ஆ").unwrap(), "கா");
        assert_eq!(layout.combine("க்", "ஐ").unwrap(), "கை");
    }

    #[test]
    fn test_combine_all_vowels_for_one_consonant() {
        let layout = LayoutDef::load_pm0100();
        let vowels = ["அ","ஆ","இ","ஈ","உ","ஊ","எ","ஏ","ஐ","ஒ","ஓ","ஔ"];
        for v in vowels {
            assert!(layout.combine("த்", v).is_some(), "Missing combo: த்+{}", v);
        }
    }
}

    #[test]
    fn test_all_pm0100_characters_generated() {
        let layout = LayoutDef::load_pm0100();
        let mut chars = std::collections::HashSet::new();
        
        // Standalone consonants
        for cons in layout.layers.base.values() {
            chars.insert(cons.clone());
        }
        
        // Standalone vowels
        for v in layout.layers.vowels.values() {
            chars.insert(v.clone());
        }
        for v in layout.layers.vowels_long.values() {
            chars.insert(v.clone());
        }
        for v in layout.layers.vowels_special.values() {
            chars.insert(v.clone());
        }
        
        // Combinations
        for cons in layout.layers.base.values() {
            for v in &["அ","ஆ","இ","ஈ","உ","ஊ","எ","ஏ","ஐ","ஒ","ஓ","ஔ"] {
                if let Some(combined) = layout.combine(cons, v) {
                    chars.insert(combined.clone());
                }
            }
        }
        
        assert_eq!(chars.len(), 247, "Expected 247 unique characters, got {}", chars.len());
    }
