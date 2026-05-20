package com.yazhi.illakiya.ui.settings

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazhi.illakiya.data.PreferencesManager
import com.yazhi.illakiya.ui.theme.IllakiyaTheme
import kotlinx.coroutines.launch

class SettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val prefsManager = remember { PreferencesManager(this@SettingsActivity) }
            val settings by prefsManager.settings.collectAsState()
            
            IllakiyaTheme(darkTheme = settings.darkTheme) {
                SettingsScreen(
                    prefsManager = prefsManager,
                    settings = settings,
                    onBack = { finish() }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    prefsManager: PreferencesManager,
    settings: com.yazhi.illakiya.data.IllakiyaSettings,
    onBack: () -> Unit
) {
    val scrollState = rememberScrollState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Illakiya Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // === THEME SECTION ===
            SettingsSectionHeader("Appearance")
            
            SettingsToggle(
                title = "Dark Theme",
                description = "Use dark mode interface",
                checked = settings.darkTheme,
                onCheckedChange = { prefsManager.setDarkTheme(it) }
            )
            
            Divider()
            
            // === INPUT SECTION ===
            SettingsSectionHeader("Input Behavior")
            
            SettingsToggle(
                title = "Smart Sandhi (Beta)",
                description = "AI-powered word detection and suggestions",
                checked = settings.sandhiEnabled,
                onCheckedChange = { prefsManager.setSandhiEnabled(it) }
            )
            
            SettingsToggle(
                title = "Swipe for Long Vowels",
                description = "Swipe up to type നெടില് (long vowels: ஆ, ஈ, etc.)",
                checked = settings.swipeNedilEnabled,
                onCheckedChange = { prefsManager.setSwipeNedilEnabled(it) }
            )
            
            Divider()
            
            // === FEEDBACK SECTION ===
            SettingsSectionHeader("Feedback")
            
            SettingsToggle(
                title = "Sound Feedback",
                description = "Click sound on key press",
                checked = settings.soundFeedback,
                onCheckedChange = { prefsManager.setSoundFeedback(it) }
            )
            
            SettingsToggle(
                title = "Haptic Feedback",
                description = "Vibration on key press",
                checked = settings.hapticFeedback,
                onCheckedChange = { prefsManager.setHapticFeedback(it) }
            )
            
            Divider()
            
            // === KEYBOARD CUSTOMIZATION ===
            SettingsSectionHeader("Keyboard")
            
            // Key Size Slider
            SettingsSlider(
                title = "Key Size",
                value = settings.keySize.toFloat(),
                min = 40f,
                max = 60f,
                step = 2f,
                onValueChange = { prefsManager.setKeySize(it.toInt()) },
                suffix = " dp"
            )
            
            // Font Size Slider
            SettingsSlider(
                title = "Font Size",
                value = settings.fontSize.toFloat(),
                min = 14f,
                max = 24f,
                step = 1f,
                onValueChange = { prefsManager.setFontSize(it.toInt()) },
                suffix = " sp"
            )
            
            Divider()
            
            // === LAYOUT SECTION ===
            SettingsSectionHeader("Layout")
            
            Text(
                text = "Current Layout: ${settings.layout}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 8.dp)
            )
            
            Text(
                text = "PM0100 is the Sangam standard Tamil keyboard layout (247 characters: 18 consonants × 12 vowels + vowel combinations).",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(8.dp)
            )
            
            Divider()
            
            // === ABOUT SECTION ===
            SettingsSectionHeader("About")
            
            Text(
                text = "Illakiya v0.1.0-beta",
                style = MaterialTheme.typography.bodyMedium
            )
            
            Text(
                text = "Sangam Tamil Keyboard\n© 2026 Yazhi • FLOSS • Privacy-first",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(vertical = 8.dp)
            )
            
            // === RESET BUTTON ===
            Button(
                onClick = { prefsManager.resetDefaults() },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Reset to Defaults")
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    )
}

@Composable
private fun SettingsToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            modifier = Modifier.padding(start = 16.dp)
        )
    }
}

@Composable
private fun SettingsSlider(
    title: String,
    value: Float,
    min: Float,
    max: Float,
    step: Float,
    onValueChange: (Float) -> Unit,
    suffix: String = ""
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "${value.toInt()}$suffix",
                style = MaterialTheme.typography.bodyMedium
            )
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = min..max,
            steps = ((max - min) / step).toInt() - 1,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        )
    }
}
