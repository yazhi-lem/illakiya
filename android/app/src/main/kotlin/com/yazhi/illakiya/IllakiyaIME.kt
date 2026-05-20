package com.yazhi.illakiya

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.InputConnection
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable

class IllakiyaIME : InputMethodService() {

    private val composer = PM0100Composer()

    override fun onCreateInputView(): View {
        return ComposeView(this).apply {
            setContent {
                MaterialTheme {
                    Surface(color = Color(0xFF1A1612)) {
                        IllakiyaKeyboard(
                            onCommit = { value -> handleKey(value) },
                            onBackspace = { handleBackspace() },
                            onSpace = { handleSpace() }
                        )
                    }
                }
            }
        }
    }

    private fun commitText(value: String) {
        val inputConnection: InputConnection = currentInputConnection ?: return
        inputConnection.commitText(value, 1)
    }

    private fun handleKey(value: String) {
        val inputConnection: InputConnection = currentInputConnection ?: return
        composer.commitKey(inputConnection, value)
    }

    private fun handleSpace() {
        commitText(" ")
    }

    private fun handleBackspace() {
        val inputConnection: InputConnection = currentInputConnection ?: return
        composer.handleBackspace(inputConnection)
    }
}

private class PM0100Composer {
    private val meiToUyirBase = mapOf(
        "க்" to "க",
        "ச்" to "ச",
        "ட்" to "ட",
        "த்" to "த",
        "ப்" to "ப",
        "ற்" to "ற",
        "ய்" to "ய",
        "ர்" to "ர",
        "ல்" to "ல",
        "வ்" to "வ",
        "ழ்" to "ழ",
        "ள்" to "ள",
        "ங்" to "ங",
        "ஞ்" to "ஞ",
        "ண்" to "ண",
        "ந்" to "ந",
        "ம்" to "ம",
        "ன்" to "ன"
    )

    private val vowels = setOf("அ", "இ", "உ", "எ", "ஒ")

    private val vowelSigns = mapOf(
        "அ" to "",
        "இ" to "ி",
        "உ" to "ு",
        "எ" to "ெ",
        "ஒ" to "ொ"
    )

    fun commitKey(inputConnection: InputConnection, key: String) {
        if (!vowels.contains(key)) {
            inputConnection.commitText(key, 1)
            return
        }

        val previous = inputConnection.getTextBeforeCursor(1, 0)?.toString().orEmpty()
        val base = meiToUyirBase[previous]

        if (base == null) {
            inputConnection.commitText(key, 1)
            return
        }

        val sign = vowelSigns[key].orEmpty()
        inputConnection.deleteSurroundingText(1, 0)
        inputConnection.commitText(base + sign, 1)
    }

    fun handleBackspace(inputConnection: InputConnection) {
        val before = inputConnection.getTextBeforeCursor(2, 0)?.toString().orEmpty()
        if (before.isEmpty()) {
            return
        }

        for ((mei, base) in meiToUyirBase) {
            for ((_, sign) in vowelSigns) {
                val composed = base + sign
                if (before.endsWith(composed)) {
                    inputConnection.deleteSurroundingText(composed.length, 0)
                    inputConnection.commitText(mei, 1)
                    return
                }
            }
        }

        inputConnection.deleteSurroundingText(1, 0)
    }
}

private data class KeyDef(
    val char: String,
    val color: Color
)

@Composable
private fun IllakiyaKeyboard(
    onCommit: (String) -> Unit,
    onBackspace: () -> Unit,
    onSpace: () -> Unit
) {
    val vallinam = Color(0xFF8B4513)
    val idaiyinam = Color(0xFF2E5A3A)
    val mellinam = Color(0xFF3D4A6B)
    val vowel = Color(0xFF4A3F32)

    val rows = remember {
        listOf(
            listOf("க்", "ச்", "ட்", "த்", "ப்", "ற்").map { KeyDef(it, vallinam) },
            listOf("ய்", "ர்", "ல்", "வ்", "ழ்", "ள்").map { KeyDef(it, idaiyinam) },
            listOf("ங்", "ஞ்", "ண்", "ந்", "ம்", "ன்").map { KeyDef(it, mellinam) },
            listOf("அ", "இ", "உ", "எ", "ஒ").map { KeyDef(it, vowel) }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1612))
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        rows.take(3).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                row.forEach { key ->
                    KeyButton(
                        label = key.char,
                        color = key.color,
                        onClick = { onCommit(key.char) }
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            rows.last().forEach { key ->
                KeyButton(
                    label = key.char,
                    color = key.color,
                    onClick = { onCommit(key.char) }
                )
            }
            KeyButton(label = "⎵", color = vowel, onClick = onSpace)
            KeyButton(label = "⌫", color = vowel, onClick = onBackspace)
        }
    }
}

@Composable
private fun KeyButton(
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .padding(horizontal = 3.dp)
            .size(width = 48.dp, height = 48.dp)
            .heightIn(min = 44.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        color = color
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = label,
                color = Color(0xFFE8DFD4),
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
