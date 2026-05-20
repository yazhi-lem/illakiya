#[uniffi::export]
impl Dictionary {
    #[uniffi::constructor]
    pub fn new() -> Self {
        let json = include_str!("../../data/dictionary/tamil_base.json");
        let dict_file: DictFile = serde_json::from_str(json)
            .expect("Invalid tamil_base.json");
        

        // Build trie
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
        
        Self {
            entries,
            trie,
            recents: std::sync::RwLock::new(Vec::new()),
            max_recents: 100,
        }
    }

    /// Look up an exact word. Returns entry if found.
    pub fn lookup(&self, word: String) -> Option<DictEntry> {
        let mut node = &self.trie;
        for ch in word.chars() {
            match node.children.get(&ch) {
                Some(next) => node = next,
                None => return None,
            }
        }
        if node.is_word {
            node.entries.first().map(|&idx| self.entries[idx].clone())
        } else {
            None
        }
    }

    /// Check if a word exists in the dictionary
    pub fn contains(&self, word: String) -> bool {
        self.lookup(word).is_some()
    }

    /// Prefix search: find all words starting with the given prefix.
    /// Returns up to `limit` results, sorted by frequency (descending).
    pub fn suggest(&self, prefix: String, limit: u32) -> Vec<String> {
        if prefix.is_empty() { return Vec::new(); }

        // Navigate to prefix node
        let mut node = &self.trie;
        for ch in prefix.chars() {
            match node.children.get(&ch) {
                Some(next) => node = next,
                None => return Vec::new(),
            }
        }

        // Collect all words under this node
        let mut candidates: Vec<(String, u32)> = Vec::new();
        self.collect_words(node, &mut candidates);

        // Boost recent words
        let recents = self.recents.read().unwrap();
        for (word, freq) in candidates.iter_mut() {
            if recents.contains(word) {
                *freq += 50; // Recency boost
            }
        }

        // Sort by frequency descending
        candidates.sort_by(|a, b| b.1.cmp(&a.1));
        candidates.truncate(limit as usize);
        candidates.into_iter().map(|(w, _)| w).collect()
    }

    /// Recursively collect all words from a trie node
    fn collect_words(&self, node: &TrieNode, results: &mut Vec<(String, u32)>) {
        for &idx in &node.entries {
            let entry = &self.entries[idx];
            results.push((entry.tamil.clone(), entry.freq));
        }
        for child in node.children.values() {
            self.collect_words(child, results);
        }
    }

    /// Record that a word was typed (for recency boosting)
    pub fn record_usage(&self, word: String) {
        let mut recents = self.recents.write().unwrap();
        // Remove if already in recents
        recents.retain(|w| w != word);
        // Push to front
        recents.insert(0, word);
        // Trim
        if recents.len() > self.max_recents {
            recents.pop();
        }
    }

    /// Get word count
    pub fn word_count(&self) -> u32 {
        self.entries.len() as u32
    }

    /// Get translation for a Tamil word
    pub fn translate(&self, word: String) -> Option<String> {
        self.lookup(word).map(|e| e.en.clone())
    }

    /// Get transliteration for a Tamil word
    pub fn transliterate(&self, word: String) -> Option<String> {
        self.lookup(word).map(|e| e.translit.clone())
    }
}