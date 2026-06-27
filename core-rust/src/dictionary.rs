use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Clone, Deserialize, uniffi::Record)]
pub struct DictEntry {
    pub tamil: String,
    pub translit: String,
    pub en: String,
    pub freq: u32,
}

#[derive(Deserialize)]
struct DictFile {
    words: Vec<DictEntry>,
}

#[derive(Default)]
struct TrieNode {
    children: HashMap<char, TrieNode>,
    is_word: bool,
    entries: Vec<usize>,
}

#[derive(uniffi::Object)]
pub struct Dictionary {
    entries: Vec<DictEntry>,
    trie: TrieNode,
    recents: std::sync::RwLock<Vec<String>>,
    max_recents: usize,
}

// Internal helpers — not exported via FFI, callable from within the crate
impl Dictionary {
    fn lookup_str(&self, word: &str) -> Option<&DictEntry> {
        let mut node = &self.trie;
        for ch in word.chars() {
            node = node.children.get(&ch)?;
        }
        if node.is_word {
            node.entries.first().map(|&idx| &self.entries[idx])
        } else {
            None
        }
    }

    fn collect_words(node: &TrieNode, entries: &[DictEntry], results: &mut Vec<(String, u32)>) {
        for &idx in &node.entries {
            results.push((entries[idx].tamil.clone(), entries[idx].freq));
        }
        for child in node.children.values() {
            Self::collect_words(child, entries, results);
        }
    }

    pub(crate) fn contains_str(&self, word: &str) -> bool {
        self.lookup_str(word).is_some()
    }

    pub(crate) fn suggest_prefix(&self, prefix: &str, limit: u32) -> Vec<String> {
        if prefix.is_empty() {
            return Vec::new();
        }
        let mut node = &self.trie;
        for ch in prefix.chars() {
            match node.children.get(&ch) {
                Some(next) => node = next,
                None => return Vec::new(),
            }
        }
        let mut candidates: Vec<(String, u32)> = Vec::new();
        Self::collect_words(node, &self.entries, &mut candidates);

        let recents = self.recents.read().unwrap();
        for (word, freq) in candidates.iter_mut() {
            if recents.contains(word) {
                *freq += 50;
            }
        }
        candidates.sort_by(|a, b| b.1.cmp(&a.1));
        candidates.truncate(limit as usize);
        candidates.into_iter().map(|(w, _)| w).collect()
    }

    pub(crate) fn record_usage_str(&self, word: &str) {
        let mut recents = self.recents.write().unwrap();
        recents.retain(|w| w.as_str() != word);
        recents.insert(0, word.to_string());
        if recents.len() > self.max_recents {
            recents.pop();
        }
    }

    pub(crate) fn translate_str(&self, word: &str) -> Option<String> {
        self.lookup_str(word).map(|e| e.en.clone())
    }
}

#[uniffi::export]
impl Dictionary {
    /// Construct the dictionary, loading the embedded Tamil word list.
    #[uniffi::constructor]
    pub fn new() -> Arc<Self> {
        let json = include_str!("../../data/dictionary/tamil_base.json");
        let dict_file: DictFile =
            serde_json::from_str(json).expect("Invalid tamil_base.json");

        let mut trie = TrieNode::default();
        let mut entries = Vec::new();
        for (i, entry) in dict_file.words.into_iter().enumerate() {
            entries.push(entry);
            let mut node = &mut trie;
            for ch in entries[i].tamil.chars() {
                node = node.children.entry(ch).or_default();
            }
            node.is_word = true;
            node.entries.push(i);
        }

        Arc::new(Self {
            entries,
            trie,
            recents: std::sync::RwLock::new(Vec::new()),
            max_recents: 100,
        })
    }

    pub fn lookup(&self, word: String) -> Option<DictEntry> {
        self.lookup_str(&word).cloned()
    }

    pub fn contains(&self, word: String) -> bool {
        self.contains_str(&word)
    }

    pub fn suggest(&self, prefix: String, limit: u32) -> Vec<String> {
        self.suggest_prefix(&prefix, limit)
    }

    pub fn record_usage(&self, word: String) {
        self.record_usage_str(&word);
    }

    pub fn word_count(&self) -> u32 {
        self.entries.len() as u32
    }

    pub fn translate(&self, word: String) -> Option<String> {
        self.translate_str(&word)
    }

    pub fn transliterate(&self, word: String) -> Option<String> {
        self.lookup_str(&word).map(|e| e.translit.clone())
    }
}
