package com.yazhi.illakiya.ui.keyboard

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.MaterialTheme
import com.yazhi.illakiya.ui.theme.*
import androidx.compose.ui.text.font.FontWeight

// Key Data Structure (mirrors PM0100 JSON)
data class Key(
    val label: String,
    val value: String,
    val type: KeyType = KeyType.VOWEL
)

enum class KeyType {
    VALLINAM,    // Consonants (hard) - Terracotta
    IDAIYINAM,   // Consonants (soft) - Muted Terracotta
    MELLINAM,    // Consonants (nasal) - Deep Slate
    VOWEL,       // Vowels - Muted Slate
    SPECIAL      // Space, Backspace, etc. - Gradient
}

@Composable
fun KeyboardView(
    keys: List<Key>,
    onKeyPress: (String) -> Unit,
    keySize: Int = 48,
    fontSize: Int = 18,
    pendingKey: String? = null
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(6),
        modifier = Modifier.padding(4.dp)
    ) {
        items(keys) { key ->
            KeyButton(
                key = key,
                onClick = { onKeyPress(key.value) },
                size = keySize,
                fontSize = fontSize,
                isPending = key.value == pendingKey
            )
        }
    }
}

@Composable
fun KeyButton(
    key: Key,
    onClick: () -> Unit,
    size: Int = 48,
    fontSize: Int = 18,
    isPending: Boolean = false
) {
    val (backgroundColor, textColor) = when (key.type) {
        KeyType.VALLINAM -> {
            // Warm terracotta for main consonants
            Pair(VallinamBase, SangamTextLight)
        }
        KeyType.IDAIYINAM -> {
            // Muted terracotta for soft consonants
            Pair(IdaiyinamBase, SangamTextLight)
        }
        KeyType.MELLINAM -> {
            // Deep slate for nasal consonants
            Pair(MellinamBase, SangamTextLight)
        }
        KeyType.VOWEL -> {
            // Muted slate for vowels
            Pair(VowelBase, SangamTextLight)
        }
        KeyType.SPECIAL -> {
            // Mixed gradient for special keys
            Pair(SangamBgMedium, SangamTextLight)
        }
    }
    
    Button(
        onClick = onClick,
        modifier = Modifier
            .padding(2.dp)
            .then(
                if (isPending)
                    Modifier.background(
                        color = SangamPrimary.copy(alpha = 0.3f),
                        shape = RoundedCornerShape(8.dp)
                    )
                else Modifier
            ),
        colors = ButtonDefaults.buttonColors(
            containerColor = backgroundColor,
            contentColor = textColor
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = key.label,
            fontSize = fontSize.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(4.dp)
        )
    }
}

