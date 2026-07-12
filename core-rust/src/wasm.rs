//! WebAssembly bindings for the Illakiya keyboard engine.
//!
//! This is a thin `wasm-bindgen` wrapper over the existing [`KeyboardEngine`]
//! (`engine.rs`) so the web app can use the *same* Rust composition, dictionary
//! and Tholkaappiyam sandhi logic that ships on Android — no logic is
//! duplicated here. It is compiled only under the `wasm` feature, so the
//! default (UniFFI/Android) build is unaffected.
//!
//! Build with `scripts/build-wasm.sh` (wasm-pack), which emits
//! `web/src/wasm/illakiya_core.js` + `.wasm`. If the artifact is absent the web
//! app falls back to its TypeScript engine (`web/src/lib/engine.ts`).

use crate::engine::KeyboardEngine;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmEngine {
    inner: Arc<KeyboardEngine>,
}

#[wasm_bindgen]
impl WasmEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmEngine {
        WasmEngine {
            inner: KeyboardEngine::new(),
        }
    }

    /// Feed one PM0100 key (or "space"/"backspace"/"enter"/"nedil") and get the
    /// emitted text delta.
    pub fn process_input(&self, key: String) -> String {
        self.inner.process_input(key)
    }

    /// Trie prefix suggestions for the in-progress word.
    pub fn get_suggestions(&self, limit: u32) -> Vec<String> {
        self.inner.get_suggestions(limit)
    }

    /// Tholkaappiyam sandhi join across the last word boundary, if confident.
    pub fn get_sandhi_suggestion(&self) -> Option<String> {
        self.inner.get_sandhi_suggestion()
    }

    pub fn is_valid_word(&self, word: String) -> bool {
        self.inner.is_valid_word(word)
    }

    pub fn get_current_word(&self) -> String {
        self.inner.get_current_word()
    }

    pub fn reset(&self) {
        self.inner.reset()
    }
}

impl Default for WasmEngine {
    fn default() -> Self {
        Self::new()
    }
}
