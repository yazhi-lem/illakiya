package com.yazhi.illakiya.ui.keyboard

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazhi.illakiya.ui.theme.IdaiyinamBase
import com.yazhi.illakiya.ui.theme.MellinamBase
import com.yazhi.illakiya.ui.theme.SangamBgDark
import com.yazhi.illakiya.ui.theme.SangamBgLight
import com.yazhi.illakiya.ui.theme.SangamBgMedium
import com.yazhi.illakiya.ui.theme.SangamPrimary
import com.yazhi.illakiya.ui.theme.SangamTextLight
import com.yazhi.illakiya.ui.theme.SangamTextMuted
import com.yazhi.illakiya.ui.theme.VallinamBase
import com.yazhi.illakiya.ui.theme.VowelBase
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * The keyboard grid. Every row fills the width; keys share it by weight.
 * Tap sends [Key.value]; long-press on a vowel with a [Key.longLabel] sends the
 * long vowel; holding backspace repeats.
 */
@Composable
fun KeyboardView(
    rows: List<List<Key>>,
    onKeyPress: (String) -> Unit,
    onLongVowel: (String) -> Unit,
    keyHeight: Int = 48,
    fontSize: Int = 18,
    nedilActive: Boolean = false,
    pendingLabel: String? = null,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SangamBgDark)
            .padding(horizontal = 3.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                row.forEach { key ->
                    KeyButton(
                        key = key,
                        modifier = Modifier.weight(key.weight),
                        height = keyHeight,
                        fontSize = fontSize,
                        highlighted = (key.value == KeyCodes.NEDIL && nedilActive) ||
                            (pendingLabel != null && key.label == pendingLabel),
                        onKeyPress = onKeyPress,
                        onLongVowel = onLongVowel,
                    )
                }
            }
        }
    }
}

private fun colorsFor(type: KeyType): Pair<Color, Color> = when (type) {
    KeyType.VALLINAM -> VallinamBase to SangamTextLight
    KeyType.IDAIYINAM -> IdaiyinamBase to SangamTextLight
    KeyType.MELLINAM -> MellinamBase to SangamTextLight
    KeyType.VOWEL -> VowelBase to SangamTextLight
    KeyType.SYMBOL -> SangamBgLight to SangamTextLight
    KeyType.SPECIAL -> SangamBgMedium to SangamTextLight
}

@Composable
private fun KeyButton(
    key: Key,
    modifier: Modifier,
    height: Int,
    fontSize: Int,
    highlighted: Boolean,
    onKeyPress: (String) -> Unit,
    onLongVowel: (String) -> Unit,
) {
    val (background, textColor) = colorsFor(key.type)
    var pressed by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val currentOnKeyPress by rememberUpdatedState(onKeyPress)
    val currentOnLongVowel by rememberUpdatedState(onLongVowel)
    val repeats = key.value == KeyCodes.BACKSPACE
    val labelSize = when {
        key.label.length > 4 -> (fontSize - 5).coerceAtLeast(11)
        key.type == KeyType.SPECIAL -> (fontSize - 2).coerceAtLeast(12)
        else -> fontSize
    }

    Box(
        modifier = modifier
            .height(height.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(
                when {
                    pressed -> SangamPrimary
                    highlighted -> SangamPrimary.copy(alpha = 0.75f)
                    else -> background
                }
            )
            .semantics { contentDescription = key.longLabel?.let { "${key.label}, ${it}" } ?: key.label }
            .pointerInput(key) {
                detectTapGestures(
                    onPress = {
                        pressed = true
                        var repeatJob: Job? = null
                        if (repeats) {
                            currentOnKeyPress(key.value)
                            repeatJob = scope.launch {
                                delay(400)
                                while (true) {
                                    currentOnKeyPress(key.value)
                                    delay(60)
                                }
                            }
                        }
                        tryAwaitRelease()
                        repeatJob?.cancel()
                        pressed = false
                    },
                    onTap = { if (!repeats) currentOnKeyPress(key.value) },
                    onLongPress = if (key.longLabel != null) {
                        { _: Offset -> currentOnLongVowel(key.value) }
                    } else {
                        null
                    },
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = key.label,
            color = textColor,
            fontSize = labelSize.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 1,
        )
        key.longLabel?.let { hint ->
            Text(
                text = hint,
                color = SangamTextMuted,
                fontSize = 10.sp,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 2.dp, end = 4.dp),
            )
        }
    }
}
