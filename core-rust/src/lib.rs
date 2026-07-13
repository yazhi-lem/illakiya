// uniffi 0.25 emits a harmless warning from function-pointer comparisons in its macro
#![allow(unpredictable_function_pointer_comparisons)]
uniffi::setup_scaffolding!();

pub mod dictionary;
pub mod engine;
pub mod layout;
pub mod sandhi;
pub mod tamil;

pub use dictionary::Dictionary;
pub use engine::KeyboardEngine;
pub use sandhi::AdhanSandhi;
