use serde::Deserialize;
use std::collections::HashMap;

/// Tamil Unicode helpers — classifies characters by phonetic category.
/// Based on Tholkaappiyam's three-class system.

/// Vallinam (Hard consonants): க, ச, ட, த, ப, ற
const VALLINAM: [char; 6] = ['க', 'ச', 'ட', 'த', 'ப', 'ற'];

/// Mellinam (Soft consonants): ங, ஞ, ண, ந, ம, ன
const MELLINAM: [char; 6] = ['ங', 'ஞ', 'ண', 'ந', 'ம', 'ன'];

/// Idaiyinam (Medium consonants): ய, ர, ல, வ, ழ, ள
const IDAIYINAM: [char; 6] = ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள'];

/// Short vowels: அ, இ, உ, எ, ஒ
const KURIL: [char; 5] = ['அ', 'இ', 'உ', 'எ', 'ஒ'];

/// Long vowels: ஆ, ஈ, ஊ, ஏ, ஓ, ஐ, ஔ
const NEDIL: [char; 7] = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஓ', 'ஐ', 'ஔ'];

/// Pulli (virama): ்
const PULLI: char = '்';

/// Vallinam -> Mellinam pairing (for nasal insertion)
/// க->ங, ச->ஞ, ட->ண, த->ந, ப->ம, ற->ன
pub fn vallinam_to_mellinam(c: char) -> Option<char> {
    match c {
        'க' => Some('ங'),
        'ச' => Some('ஞ'),
        'ட' => Some('ண'),
        'த' => Some('ந'),
        'ப' => Some('ம'),
        'ற' => Some('ன'),
        _ => None,
    }
}

pub fn is_vallinam(c: char) -> bool { VALLINAM.contains(&c) }
pub fn is_mellinam(c: char) -> bool { MELLINAM.contains(&c) }
pub fn is_idaiyinam(c: char) -> bool { IDAIYINAM.contains(&c) }
pub fn is_kuril(c: char) -> bool { KURIL.contains(&c) }
pub fn is_nedil(c: char) -> bool { NEDIL.contains(&c) }
pub fn is_pulli(c: char) -> bool { c == PULLI }
pub fn is_uyir(c: char) -> bool { is_kuril(c) || is_nedil(c) }
pub fn is_mei(c: char) -> bool { is_vallinam(c) || is_mellinam(c) || is_idaiyinam(c) }

/// Get the base consonant from an uyirmei character.
/// Tamil Unicode: uyirmei range 0x0B95-0x0BD7
/// Returns None if not an uyirmei.
pub fn get_base_consonant(c: char) -> Option<char> {
    let cp = c as u32;
    // Tamil consonant range
    if cp >= 0x0B95 && cp <= 0x0BB9 {
        return Some(c); // Already a base consonant
    }
    None
}

/// Check if the last character of a string ends in a short vowel sound
/// (either a standalone kuril or an uyirmei with inherent 'a')
pub fn ends_with_short_vowel(word: &str) -> bool {
    let chars: Vec<char> = word.chars().collect();
    if chars.is_empty() { return false; }
    let last = chars[chars.len() - 1];
    
    // Standalone short vowel
    if is_kuril(last) { return true; }
    
    // Not ending in pulli means inherent 'a' sound (short)
    if !is_pulli(last) && is_mei(last) { return false; }
    
    // Check for uyirmei ending (no pulli = has vowel)
    let cp = last as u32;
    if cp >= 0x0B95 && cp <= 0x0BD7 && !is_pulli(last) {
        return true; // uyirmei with short vowel
    }
    
    false
}

/// Check if word ends with pulli (virama)
pub fn ends_with_pulli(word: &str) -> bool {
    word.chars().last().map_or(false, is_pulli)
}

/// Get the first consonant of a word (stripping vowel signs)
pub fn first_consonant(word: &str) -> Option<char> {
    word.chars().next().filter(|&c| is_mei(c) || is_vallinam(c))
}
