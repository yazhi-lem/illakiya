package com.yazhi.illakiya.service

import android.content.Context
import android.inputmethodservice.InputMethodService
import android.media.AudioManager
import android.os.Build
import android.text.InputType
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.SuggestionChipDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.yazhi.illakiya.core.KeyboardEngine
import com.yazhi.illakiya.data.IllakiyaSettings
import com.yazhi.illakiya.data.PreferencesManager
import com.yazhi.illakiya.ui.keyboard.KeyCodes
import com.yazhi.illakiya.ui.keyboard.KeyboardLayouts
import com.yazhi.illakiya.ui.keyboard.KeyboardView
import com.yazhi.illakiya.ui.theme.IllakiyaTheme
import com.yazhi.illakiya.ui.theme.SangamBgMedium
import com.yazhi.illakiya.ui.theme.SangamPrimary
import com.yazhi.illakiya.ui.theme.SangamTextLight

/**
 * Illakiya Tamil keyboard (PM0100) on the Rust engine.
 *
 * Text model: the engine holds a consonant (க்) until the next key decides it
 * (vowel → uyirmei, anything else → plain mei). While it is held it is shown
 * as composing text, so the user always sees what they typed; committing the
 * engine's output replaces that composing text.
 */
class IllakiyaIME : InputMethodService(), LifecycleOwner, SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    private val engine by lazy { KeyboardEngine() }

    // Compose state, read by the keyboard UI.
    private var symbols by mutableStateOf(false)
    private var suggestions by mutableStateOf<List<String>>(emptyList())
    private var sandhiHint by mutableStateOf<String?>(null)
    private var pending by mutableStateOf<String?>(null)
    private var nedil by mutableStateOf(false)
    private var settings by mutableStateOf(IllakiyaSettings())

    private var keyboardView: View? = null

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val savedStateRegistry: SavedStateRegistry
        get() = savedStateRegistryController.savedStateRegistry

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
    }

    override fun onCreateInputView(): View {
        // Compose looks up these owners from the view tree; an IME window has
        // none of its own, so attach ours to the window and the view.
        window?.window?.decorView?.let { decor ->
            decor.setViewTreeLifecycleOwner(this)
            decor.setViewTreeSavedStateRegistryOwner(this)
        }
        return ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@IllakiyaIME)
            setViewTreeSavedStateRegistryOwner(this@IllakiyaIME)
            setContent { KeyboardUi() }
        }.also { keyboardView = it }
    }

    override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
        super.onStartInput(attribute, restarting)
        engine.reset()
        refreshState()
        val inputClass = (attribute?.inputType ?: 0) and InputType.TYPE_MASK_CLASS
        symbols = inputClass == InputType.TYPE_CLASS_NUMBER ||
            inputClass == InputType.TYPE_CLASS_PHONE ||
            inputClass == InputType.TYPE_CLASS_DATETIME
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        settings = PreferencesManager(this).settings.value
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        currentInputConnection?.finishComposingText()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
        super.onFinishInputView(finishingInput)
    }

    override fun onUpdateSelection(
        oldSelStart: Int, oldSelEnd: Int, newSelStart: Int, newSelEnd: Int,
        candidatesStart: Int, candidatesEnd: Int,
    ) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
        // The user selected text or moved the cursor somewhere else: the
        // engine's view of the current word no longer matches the editor.
        val movedAway = candidatesStart == -1 && pending != null
        if (newSelStart != newSelEnd || movedAway) {
            currentInputConnection?.finishComposingText()
            engine.reset()
            refreshState()
        }
    }

    override fun onDestroy() {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        engine.reset()
        keyboardView = null
        super.onDestroy()
    }

    // ---- Key handling --------------------------------------------------------

    private fun onKey(code: String) {
        feedback()
        when (code) {
            KeyCodes.SYMBOLS -> { flushPending(); symbols = true }
            KeyCodes.TAMIL -> symbols = false
            KeyCodes.SWITCH_IME -> switchKeyboard()
            KeyCodes.ENTER -> enter()
            KeyCodes.BACKSPACE -> backspace()
            else -> type(code)
        }
        refreshState()
    }

    /** Long-press on a vowel: the long form (அ → ஆ), whatever the ⇧ state. */
    private fun onLongVowel(code: String) {
        feedback()
        if (!engine.isNedilActive()) engine.toggleNedil()
        type(code)
        refreshState()
    }

    private fun type(code: String) {
        val ic = currentInputConnection ?: return
        val output = engine.processInput(code)
        ic.beginBatchEdit()
        if (output.isNotEmpty()) ic.commitText(output, 1)
        engine.getPending()?.let { ic.setComposingText(it, 1) }
        ic.endBatchEdit()
    }

    private fun backspace() {
        val ic = currentInputConnection ?: return
        val hadPending = engine.getPending() != null
        engine.processInput(KeyCodes.BACKSPACE)
        if (hadPending) {
            // The held consonant was only composing text: just clear it.
            ic.setComposingText("", 1)
            ic.finishComposingText()
        } else if (ic.getSelectedText(0).isNullOrEmpty()) {
            ic.deleteSurroundingText(1, 0)
        } else {
            ic.commitText("", 1)
        }
    }

    private fun enter() {
        val ic = currentInputConnection ?: return
        val pendingPart = engine.processInput(KeyCodes.ENTER).removeSuffix("\n")
        if (pendingPart.isNotEmpty()) ic.commitText(pendingPart, 1)
        val options = currentInputEditorInfo?.imeOptions ?: 0
        val action = options and EditorInfo.IME_MASK_ACTION
        val noEnterAction = (options and EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0
        if (!noEnterAction && action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
            ic.performEditorAction(action)
        } else {
            ic.commitText("\n", 1)
        }
    }

    /** Commit a held consonant as-is (before switching layers or keyboards). */
    private fun flushPending() {
        if (engine.getPending() == null) return
        val ic = currentInputConnection ?: return
        val output = engine.processInput(KeyCodes.ENTER).removeSuffix("\n")
        ic.commitText(output, 1)
        engine.reset()
    }

    private fun switchKeyboard() {
        flushPending()
        val switched = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            switchToNextInputMethod(false)
        } else {
            false
        }
        if (!switched) {
            (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).showInputMethodPicker()
        }
    }

    /** Replace the word being typed with a dictionary suggestion, then a space. */
    private fun pickSuggestion(word: String) {
        val ic = currentInputConnection ?: return
        feedback()
        val held = engine.getPending()
        val typed = engine.getCurrentWord().removeSuffix(held ?: "")
        ic.beginBatchEdit()
        if (held != null) ic.setComposingText("", 1)
        ic.finishComposingText()
        if (typed.isNotEmpty() && ic.getTextBeforeCursor(typed.length, 0)?.toString() == typed) {
            ic.deleteSurroundingText(typed.length, 0)
        }
        engine.acceptSuggestion(word)
        val space = engine.processInput(KeyCodes.SPACE)
        ic.commitText(word + space, 1)
        ic.endBatchEdit()
        refreshState()
    }

    /** வல்லினம் மிகும் இடம்: add the doubled consonant to the previous word. */
    private fun applySandhi() {
        val ic = currentInputConnection ?: return
        feedback()
        val current = engine.getCurrentWord()
        val expected = " $current"
        if (ic.getTextBeforeCursor(expected.length, 0)?.toString() != expected) return
        val suffix = engine.acceptSandhiSuggestion() ?: return
        ic.beginBatchEdit()
        ic.deleteSurroundingText(expected.length, 0)
        ic.commitText(suffix + expected, 1)
        ic.endBatchEdit()
        refreshState()
    }

    private fun refreshState() {
        pending = engine.getPending()
        nedil = engine.isNedilActive()
        suggestions = engine.getSuggestions(5u)
        sandhiHint = if (settings.sandhiEnabled) engine.getSandhiSuggestion() else null
    }

    private fun feedback() {
        val view = keyboardView ?: return
        if (settings.hapticFeedback) {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
        if (settings.soundFeedback) {
            (getSystemService(Context.AUDIO_SERVICE) as AudioManager)
                .playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD)
        }
    }

    // ---- UI --------------------------------------------------------------------

    @Composable
    private fun KeyboardUi() {
        IllakiyaTheme {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding(),
            ) {
                SuggestionStrip()
                KeyboardView(
                    rows = if (symbols) KeyboardLayouts.symbols else KeyboardLayouts.tamil,
                    onKeyPress = ::onKey,
                    onLongVowel = ::onLongVowel,
                    keyHeight = settings.keySize,
                    fontSize = settings.fontSize,
                    nedilActive = nedil,
                    pendingLabel = pending,
                )
            }
        }
    }

    @Composable
    private fun SuggestionStrip() {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(SangamBgMedium)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            sandhiHint?.let { hint ->
                SuggestionChip(
                    onClick = ::applySandhi,
                    label = { Text("⚡ $hint") },
                    colors = SuggestionChipDefaults.suggestionChipColors(
                        containerColor = SangamPrimary,
                        labelColor = SangamTextLight,
                    ),
                )
            }
            suggestions.forEach { word ->
                SuggestionChip(
                    onClick = { pickSuggestion(word) },
                    label = { Text(word) },
                    colors = SuggestionChipDefaults.suggestionChipColors(labelColor = SangamTextLight),
                )
            }
        }
    }
}
