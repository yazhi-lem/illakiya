package com.yazhi.illakiya.ui.settings

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
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
import com.yazhi.illakiya.BuildConfig
import com.yazhi.illakiya.data.PreferencesManager
import com.yazhi.illakiya.ui.theme.IllakiyaTheme

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
            // === SETUP ===
            SettingsSectionHeader("அமைப்பு · Setup")
            val context = androidx.compose.ui.platform.LocalContext.current
            Text(
                text = "1. Turn on இலக்கியா in your keyboard settings.\n2. Choose it as your keyboard.",
                style = MaterialTheme.typography.bodyMedium,
            )
            Button(
                onClick = { context.startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Enable keyboard") }
            OutlinedButton(
                onClick = {
                    (context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager)
                        .showInputMethodPicker()
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Choose keyboard") }

            HorizontalDivider()

            // === THEME SECTION ===
            SettingsSectionHeader("Appearance")

            SettingsToggle(
                title = "Dark Theme",
                description = "Use dark mode interface",
                checked = settings.darkTheme,
                onCheckedChange = { prefsManager.setDarkTheme(it) }
            )

            HorizontalDivider()

            // === INPUT SECTION ===
            SettingsSectionHeader("Input Behavior")

            SettingsToggle(
                title = "வல்லினம் மிகும் இடம் (Sandhi hints)",
                description = "Suggests the doubled consonant between words, e.g. பள்ளிக்கு சென்றான் → பள்ளிக்குச் சென்றான்",
                checked = settings.sandhiEnabled,
                onCheckedChange = { prefsManager.setSandhiEnabled(it) }
            )

            Text(
                text = "Long vowels (நெடில்): long-press a vowel key, or tap ⇧ நெடில் first.",
                style = MaterialTheme.typography.bodySmall,
            )

            HorizontalDivider()

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

            HorizontalDivider()

            // === KEYBOARD CUSTOMIZATION ===
            SettingsSectionHeader("Keyboard")

            // Key Size Slider
            SettingsSlider(
                title = "Key Height",
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

            HorizontalDivider()

            // === LAYOUT SECTION ===
            SettingsSectionHeader("Layout")

            Text(
                text = "Current Layout: ${settings.layout}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            Text(
                text = "PM0100 groups the consonants by Tholkāppiyam's classes — வல்லினம், இடையினம், மெல்லினம் — one row each, with the vowels below. Type a consonant, then a vowel: க் + ஆ → கா. All 247 Tamil letters.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(8.dp)
            )

            HorizontalDivider()

            // === ABOUT SECTION ===
            SettingsSectionHeader("About")

            Text(
                text = "Illakiya ${BuildConfig.VERSION_NAME}",
                style = MaterialTheme.typography.bodyMedium
            )

            Text(
                text = "Sangam Tamil Keyboard\n© 2026 Yazhi • FLOSS • Works offline: no internet permission, nothing you type leaves the phone.",
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
