package com.yazhi.illakiya.data

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.mutableStateOf
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Settings data model
 */
data class IllakiyaSettings(
    val darkTheme: Boolean = true,
    val sandhiEnabled: Boolean = true,
    val swipeNedilEnabled: Boolean = true,
    val soundFeedback: Boolean = true,
    val hapticFeedback: Boolean = true,
    val layout: String = "PM0100",
    val keySize: Int = 48, // in dp
    val fontSize: Int = 18 // in sp
)

/**
 * Preferences Manager - Handles persistent settings storage via SharedPreferences
 */
class PreferencesManager(private val context: Context) {
    
    companion object {
        private const val PREF_FILE = "illakiya_settings"
        private const val KEY_DARK_THEME = "dark_theme"
        private const val KEY_SANDHI_ENABLED = "sandhi_enabled"
        private const val KEY_SWIPE_NEDIL = "swipe_nedil_enabled"
        private const val KEY_SOUND_FEEDBACK = "sound_feedback"
        private const val KEY_HAPTIC_FEEDBACK = "haptic_feedback"
        private const val KEY_LAYOUT = "layout"
        private const val KEY_KEY_SIZE = "key_size"
        private const val KEY_FONT_SIZE = "font_size"
    }
    
    private val prefs: SharedPreferences = 
        context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
    
    // StateFlow for reactive updates
    private val _settings = MutableStateFlow(loadSettings())
    val settings: StateFlow<IllakiyaSettings> = _settings.asStateFlow()
    
    /**
     * Load all settings from SharedPreferences
     */
    private fun loadSettings(): IllakiyaSettings {
        return IllakiyaSettings(
            darkTheme = prefs.getBoolean(KEY_DARK_THEME, true),
            sandhiEnabled = prefs.getBoolean(KEY_SANDHI_ENABLED, true),
            swipeNedilEnabled = prefs.getBoolean(KEY_SWIPE_NEDIL, true),
            soundFeedback = prefs.getBoolean(KEY_SOUND_FEEDBACK, true),
            hapticFeedback = prefs.getBoolean(KEY_HAPTIC_FEEDBACK, true),
            layout = prefs.getString(KEY_LAYOUT, "PM0100") ?: "PM0100",
            keySize = prefs.getInt(KEY_KEY_SIZE, 48),
            fontSize = prefs.getInt(KEY_FONT_SIZE, 18)
        )
    }
    
    // ============ SETTERS ============
    
    fun setDarkTheme(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_DARK_THEME, enabled).apply()
        _settings.value = _settings.value.copy(darkTheme = enabled)
    }
    
    fun setSandhiEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SANDHI_ENABLED, enabled).apply()
        _settings.value = _settings.value.copy(sandhiEnabled = enabled)
    }
    
    fun setSwipeNedilEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SWIPE_NEDIL, enabled).apply()
        _settings.value = _settings.value.copy(swipeNedilEnabled = enabled)
    }
    
    fun setSoundFeedback(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SOUND_FEEDBACK, enabled).apply()
        _settings.value = _settings.value.copy(soundFeedback = enabled)
    }
    
    fun setHapticFeedback(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_HAPTIC_FEEDBACK, enabled).apply()
        _settings.value = _settings.value.copy(hapticFeedback = enabled)
    }
    
    fun setLayout(layout: String) {
        prefs.edit().putString(KEY_LAYOUT, layout).apply()
        _settings.value = _settings.value.copy(layout = layout)
    }
    
    fun setKeySize(size: Int) {
        require(size in 40..60) { "Key size must be between 40-60 dp" }
        prefs.edit().putInt(KEY_KEY_SIZE, size).apply()
        _settings.value = _settings.value.copy(keySize = size)
    }
    
    fun setFontSize(size: Int) {
        require(size in 14..24) { "Font size must be between 14-24 sp" }
        prefs.edit().putInt(KEY_FONT_SIZE, size).apply()
        _settings.value = _settings.value.copy(fontSize = size)
    }
    
    /**
     * Reset all settings to defaults
     */
    fun resetDefaults() {
        prefs.edit().clear().apply()
        _settings.value = IllakiyaSettings()
    }
}
