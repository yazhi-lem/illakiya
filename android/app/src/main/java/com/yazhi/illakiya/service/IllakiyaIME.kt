package com.yazhi.illakiya.service

import android.inputmethodservice.InputMethodService
import android.view.View
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import com.yazhi.illakiya.ui.theme.IllakiyaTheme
import com.yazhi.illakiya.ui.keyboard.KeyboardView
import com.yazhi.illakiya.ui.keyboard.Key
import com.yazhi.illakiya.core.KeyboardEngine

class IllakiyaIME : InputMethodService(), LifecycleOwner, SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    
    private val engine = KeyboardEngine()

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
    }

    override fun onCreateInputView(): View {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        
        return ComposeView(this).apply {
            setContent {
                IllakiyaTheme {
                    var suggestions by remember { mutableStateOf<List<String>>(emptyList()) }
                    var pendingChar by remember { mutableStateOf<String?>(null) }
                    var sandhiHint by remember { mutableStateOf<String?>(null) }
                    
                    val keys = remember {
                        listOf(
                            Key("அ", "z"), Key("இ", "x"), Key("உ", "c"),
                            Key("எ", "v"), Key("ஒ", "b"), Key("ஐ", "n"), Key("ஔ", "m"),
                            Key("க்", "q"), Key("ங்", "w"), Key("ச்", "e"),
                            Key("ஞ்", "r"), Key("ட்", "t"), Key("ண்", "y"),
                            Key("த்", "u"), Key("ந்", "i"), Key("ப்", "o"), Key("ம்", "p"),
                            Key("ய்", "a"), Key("ர்", "s"), Key("ல்", "d"),
                            Key("வ்", "f"), Key("ழ்", "g"), Key("ள்", "h"),
                            Key("ற்", "j"), Key("ன்", "k"), Key("ஃ", "l"),
                            Key("⇧", "nedil"), Key("␣", "space"), Key("⌫", "backspace")
                        )
                    }

                    Column {
                        // Suggestion strip
                        SuggestionStrip(
                            suggestions = suggestions,
                            sandhiHint = sandhiHint,
                            onSuggestionTap = { suggestion ->
                                val committed = engine.acceptSuggestion(suggestion)
                                commitText(committed)
                                suggestions = engine.getSuggestions(5u)
                                sandhiHint = engine.getSandhiSuggestion()
                            }
                        )

                        // Keyboard grid
                        KeyboardView(keys = keys, pendingKey = pendingChar) { keyCode ->
                            val output = engine.processInput(keyCode)
                            
                            if (keyCode == "backspace") {
                                deleteLastChar()
                            } else if (output.isNotEmpty() && output != "\u0008") {
                                commitText(output)
                            }
                            
                            // Update state
                            pendingChar = engine.getPending()
                            suggestions = engine.getSuggestions(5u)
                            sandhiHint = engine.getSandhiSuggestion()
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun SuggestionStrip(
        suggestions: List<String>,
        sandhiHint: String?,
        onSuggestionTap: (String) -> Unit
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            // Show sandhi hint first (if any)
            sandhiHint?.let { hint ->
                SuggestionChip(
                    onClick = { onSuggestionTap(hint) },
                    label = { Text("⚡ $hint") }
                )
            }
            
            // Dictionary suggestions
            suggestions.take(3).forEach { word ->
                SuggestionChip(
                    onClick = { onSuggestionTap(word) },
                    label = { Text(word) }
                )
            }
        }
    }

    private fun commitText(text: String) {
        currentInputConnection?.commitText(text, 1)
    }

    private fun deleteLastChar() {
        currentInputConnection?.deleteSurroundingText(1, 0)
    }

    override fun onDestroy() {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        engine.reset()
        super.onDestroy()
    }

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val savedStateRegistry: SavedStateRegistry 
        get() = savedStateRegistryController.savedStateRegistry
}
