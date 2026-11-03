//! Tamil Unicode helpers — letter classes and akshara (எழுத்து) segmentation.
//! Based on Tholkaappiyam's three-class system of consonants.

/// Vallinam (Hard consonants): க, ச, ட, த, ப, ற
const VALLINAM: [char; 6] = ['க', 'ச', 'ட', 'த', 'ப', 'ற'];

/// Mellinam (Soft/nasal consonants): ங, ஞ, ண, ந, ம, ன
const MELLINAM: [char; 6] = ['ங', 'ஞ', 'ண', 'ந', 'ம', 'ன'];

/// Idaiyinam (Medium consonants): ய, ர, ல, வ, ழ, ள
const IDAIYINAM: [char; 6] = ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள'];

/// Grantha consonants used in modern Tamil: ஜ, ஶ, ஷ, ஸ, ஹ
const GRANTHA: [char; 5] = ['ஜ', 'ஶ', 'ஷ', 'ஸ', 'ஹ'];

/// Short vowels (kuril): அ, இ, உ, எ, ஒ
const KURIL: [char; 5] = ['அ', 'இ', 'உ', 'எ', 'ஒ'];

/// Long vowels (nedil): ஆ, ஈ, ஊ, ஏ, ஓ, ஐ, ஔ
const NEDIL: [char; 7] = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஓ', 'ஐ', 'ஔ'];

/// Pulli (virama): ்
pub const PULLI: char = '்';

/// Vallinam → Mellinam pairing for nasal insertion.
/// க→ங, ச→ஞ, ட→ண, த→ந, ப→ம, ற→ன
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

pub fn is_vallinam(c: char) -> bool {
    VALLINAM.contains(&c)
}
pub fn is_mellinam(c: char) -> bool {
    MELLINAM.contains(&c)
}
pub fn is_idaiyinam(c: char) -> bool {
    IDAIYINAM.contains(&c)
}
pub fn is_kuril(c: char) -> bool {
    KURIL.contains(&c)
}
pub fn is_nedil(c: char) -> bool {
    NEDIL.contains(&c)
}
pub fn is_pulli(c: char) -> bool {
    c == PULLI
}
/// Independent vowel letter (உயிர்).
pub fn is_uyir(c: char) -> bool {
    is_kuril(c) || is_nedil(c)
}
/// One of the 18 native consonants (மெய்), without its pulli.
pub fn is_mei(c: char) -> bool {
    is_vallinam(c) || is_mellinam(c) || is_idaiyinam(c)
}
/// Any consonant letter, native or grantha.
pub fn is_consonant(c: char) -> bool {
    is_mei(c) || GRANTHA.contains(&c)
}
/// Dependent vowel sign (உயிர்மெய் குறி): ா ி ீ ு ூ ெ ே ை ொ ோ ௌ
pub fn is_matra(c: char) -> bool {
    ('\u{0BBE}'..='\u{0BCC}').contains(&c)
}

/// Vowel sign a consonant takes for an independent vowel. அ is inherent ("").
pub fn vowel_to_matra(v: char) -> Option<&'static str> {
    Some(match v {
        'அ' => "",
        'ஆ' => "ா",
        'இ' => "ி",
        'ஈ' => "ீ",
        'உ' => "ு",
        'ஊ' => "ூ",
        'எ' => "ெ",
        'ஏ' => "ே",
        'ஐ' => "ை",
        'ஒ' => "ொ",
        'ஓ' => "ோ",
        'ஔ' => "ௌ",
        _ => return None,
    })
}

/// Akshara class of one written syllable.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Akshara {
    /// Independent vowel: அ, ஆ, …
    Uyir,
    /// Consonant with pulli: க், ம், …
    Mei,
    /// Consonant carrying a vowel (inherent அ or a sign): க, கா, கு, …
    UyirMei,
    /// ஃ
    Aytham,
    /// Anything else (Latin, digits, punctuation).
    Other,
}

/// Split a word into aksharas: a base letter plus any vowel sign or pulli.
pub fn aksharas(word: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut start = None;
    for (i, c) in word.char_indices() {
        if is_matra(c) || is_pulli(c) {
            continue;
        }
        if let Some(s) = start {
            out.push(&word[s..i]);
        }
        start = Some(i);
    }
    if let Some(s) = start {
        out.push(&word[s..]);
    }
    out
}

pub fn classify(akshara: &str) -> Akshara {
    let mut chars = akshara.chars();
    let Some(first) = chars.next() else {
        return Akshara::Other;
    };
    if is_uyir(first) {
        return Akshara::Uyir;
    }
    if first == 'ஃ' {
        return Akshara::Aytham;
    }
    if is_consonant(first) {
        return if akshara.ends_with(PULLI) {
            Akshara::Mei
        } else {
            Akshara::UyirMei
        };
    }
    Akshara::Other
}

/// The vowel sound an akshara ends in, as an independent vowel letter.
/// க → அ, கி → இ, ஐ → ஐ; consonants with pulli have none.
pub fn final_vowel(akshara: &str) -> Option<char> {
    match classify(akshara) {
        Akshara::Uyir => akshara.chars().next(),
        Akshara::UyirMei => {
            let sign = akshara.chars().nth(1);
            match sign {
                None => Some('அ'),
                Some(s) => ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ']
                    .into_iter()
                    .find(|v| vowel_to_matra(*v).and_then(|m| m.chars().next()) == Some(s)),
            }
        }
        _ => None,
    }
}

/// True when the akshara is a short open syllable (குறில்): அ, இ, க, கி, கு, கெ, கொ.
pub fn is_short_syllable(akshara: &str) -> bool {
    final_vowel(akshara).is_some_and(is_kuril)
}

/// Attach a bare consonant to `word`, absorbing the word's initial vowel:
/// `attach('வ', "அடி")` → "வடி". Avoids the malformed "வ்அடி" / "வஅடி".
pub fn attach(consonant: char, word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(v) if is_uyir(v) => {
            format!(
                "{consonant}{}{}",
                vowel_to_matra(v).unwrap_or(""),
                chars.as_str()
            )
        }
        _ => format!("{consonant}{word}"),
    }
}

/// Check if the last character of a string ends in a short vowel sound.
pub fn ends_with_short_vowel(word: &str) -> bool {
    aksharas(word).last().is_some_and(|a| is_short_syllable(a))
}

/// Check if word ends with pulli (virama).
pub fn ends_with_pulli(word: &str) -> bool {
    word.chars().last().is_some_and(is_pulli)
}

/// Get the first consonant character of a word.
pub fn first_consonant(word: &str) -> Option<char> {
    word.chars().next().filter(|&c| is_mei(c))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn segments_aksharas() {
        assert_eq!(aksharas("தமிழ்"), vec!["த", "மி", "ழ்"]);
        assert_eq!(aksharas("கொடி"), vec!["கொ", "டி"]);
        assert_eq!(aksharas("அம்மா"), vec!["அ", "ம்", "மா"]);
        assert!(aksharas("").is_empty());
    }

    #[test]
    fn classifies_aksharas() {
        assert_eq!(classify("அ"), Akshara::Uyir);
        assert_eq!(classify("ம்"), Akshara::Mei);
        assert_eq!(classify("மா"), Akshara::UyirMei);
        assert_eq!(classify("ஃ"), Akshara::Aytham);
        assert_eq!(final_vowel("கை"), Some('ஐ'));
        assert_eq!(final_vowel("க"), Some('அ'));
        assert_eq!(final_vowel("க்"), None);
        assert!(is_short_syllable("கு"));
        assert!(!is_short_syllable("கா"));
    }

    #[test]
    fn attaches_without_malformed_clusters() {
        assert_eq!(attach('வ', "அடி"), "வடி");
        assert_eq!(attach('ய', "இல்லை"), "யில்லை");
        assert_eq!(attach('ண', "அழகு"), "ணழகு");
        assert_eq!(attach('க', "கடல்"), "ககடல்");
    }
}
