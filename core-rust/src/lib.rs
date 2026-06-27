// uniffi 0.25 emits a harmless warning from function-pointer comparisons in its macro
#![allow(unpredictable_function_pointer_comparisons)]
uniffi::setup_scaffolding!();

pub mod tamil;
pub mod layout;
pub mod dictionary;
pub mod sandhi;
pub mod engine;

pub use engine::KeyboardEngine;
pub use sandhi::AdhanSandhi;
pub use dictionary::Dictionary;