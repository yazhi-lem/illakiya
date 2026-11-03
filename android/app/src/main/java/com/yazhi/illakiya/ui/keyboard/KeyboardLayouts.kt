package com.yazhi.illakiya.ui.keyboard

/**
 * On-screen layouts. Codes are what the Rust engine understands
 * (data/layouts/pm0100.json): letters map to PM0100 keys, anything else is an
 * action or a literal character.
 */

/** Key roles, after Tholkāppiyam's three consonant classes. */
enum class KeyType {
    VALLINAM,   // க ச ட த ப ற
    IDAIYINAM,  // ய ர ல வ ழ ள
    MELLINAM,   // ங ஞ ண ந ம ன
    VOWEL,      // அ இ உ எ ஒ ஐ ஔ
    SYMBOL,     // digits and punctuation
    SPECIAL,    // space, backspace, enter, layer and keyboard switches
}

data class Key(
    val label: String,
    val value: String,
    val type: KeyType = KeyType.SYMBOL,
    /** Relative width within its row. */
    val weight: Float = 1f,
    /** Long-press alternative (the long vowel), shown as a hint. */
    val longLabel: String? = null,
)

object KeyCodes {
    const val SPACE = "space"
    const val BACKSPACE = "backspace"
    const val ENTER = "enter"
    const val NEDIL = "nedil"
    const val SYMBOLS = "layer_symbols"
    const val TAMIL = "layer_tamil"
    const val SWITCH_IME = "switch_ime"
}

object KeyboardLayouts {
    private fun row(type: KeyType, vararg keys: Pair<String, String>) =
        keys.map { (label, code) -> Key(label, code, type) }

    private fun vowel(short: String, long: String?, code: String) =
        Key(short, code, KeyType.VOWEL, longLabel = long)

    /** PM0100: one row per consonant class, then the vowels. */
    val tamil: List<List<Key>> = listOf(
        row(KeyType.VALLINAM, "க்" to "q", "ச்" to "e", "ட்" to "t", "த்" to "u", "ப்" to "o", "ற்" to "j"),
        row(KeyType.IDAIYINAM, "ய்" to "a", "ர்" to "s", "ல்" to "d", "வ்" to "f", "ழ்" to "g", "ள்" to "h"),
        row(KeyType.MELLINAM, "ங்" to "w", "ஞ்" to "r", "ண்" to "y", "ந்" to "i", "ம்" to "p", "ன்" to "k"),
        listOf(
            vowel("அ", "ஆ", "z"),
            vowel("இ", "ஈ", "x"),
            vowel("உ", "ஊ", "c"),
            vowel("எ", "ஏ", "v"),
            vowel("ஒ", "ஓ", "b"),
            vowel("ஐ", null, "n"),
            vowel("ஔ", null, "m"),
            Key("⌫", KeyCodes.BACKSPACE, KeyType.SPECIAL, weight = 1.4f),
        ),
        listOf(
            Key("?123", KeyCodes.SYMBOLS, KeyType.SPECIAL, weight = 1.3f),
            Key("🌐", KeyCodes.SWITCH_IME, KeyType.SPECIAL),
            Key("⇧ நெடில்", KeyCodes.NEDIL, KeyType.SPECIAL, weight = 1.6f),
            Key("இடைவெளி", KeyCodes.SPACE, KeyType.SPECIAL, weight = 3.2f),
            Key("ஃ", "l", KeyType.VOWEL),
            Key(".", ".", KeyType.SYMBOL),
            Key("⏎", KeyCodes.ENTER, KeyType.SPECIAL, weight = 1.4f),
        ),
    )

    val symbols: List<List<Key>> = listOf(
        "1234567890".map { Key(it.toString(), it.toString()) },
        listOf("@", "#", "₹", "%", "&", "-", "+", "(", ")", "/").map { Key(it, it) },
        listOf("*", "\"", "'", ":", ";", "!", "?", ",", "_", "=").map { Key(it, it) } +
            Key("⌫", KeyCodes.BACKSPACE, KeyType.SPECIAL, weight = 1.4f),
        listOf(
            Key("அஆ", KeyCodes.TAMIL, KeyType.SPECIAL, weight = 1.3f),
            Key("🌐", KeyCodes.SWITCH_IME, KeyType.SPECIAL),
            Key(",", ","),
            Key("இடைவெளி", KeyCodes.SPACE, KeyType.SPECIAL, weight = 3.6f),
            Key(".", "."),
            Key("⏎", KeyCodes.ENTER, KeyType.SPECIAL, weight = 1.4f),
        ),
    )
}
