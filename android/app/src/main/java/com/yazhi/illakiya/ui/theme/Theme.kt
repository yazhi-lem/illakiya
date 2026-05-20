package com.yazhi.illakiya.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// === SANGAM EARTH DARK THEME (Primary) ===
private val SangamDarkScheme = darkColorScheme(
    primary = SangamPrimary,           // Terracotta
    onPrimary = SangamTextLight,       // Text on primary
    primaryContainer = SangamBgMedium, // Card background
    onPrimaryContainer = SangamTextLight,
    
    secondary = SangamAccent,          // Slate accent
    onSecondary = SangamTextLight,
    secondaryContainer = SangamBgLight,
    onSecondaryContainer = SangamTextLight,
    
    tertiary = SangamPrimary,          // Use primary for tertiary
    onTertiary = SangamTextLight,
    
    background = SangamBgDark,         // Dark background
    onBackground = SangamTextLight,
    
    surface = SangamBgMedium,          // Cards/containers
    onSurface = SangamTextLight,
    surfaceDim = SangamBgDark,
    surfaceBright = SangamBgLight,
    
    error = Color(0xFFEF5350),
    onError = Color.White,
)

// === SANGAM EARTH LIGHT THEME (Alternative) ===
private val SangamLightScheme = lightColorScheme(
    primary = SangamPrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFE5DC),
    onPrimaryContainer = SangamAccent,
    
    secondary = SangamAccent,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE5EBF0),
    onSecondaryContainer = SangamAccent,
    
    tertiary = SangamPrimary,
    onTertiary = Color.White,
    
    background = Color(0xFFFAF7F2),
    onBackground = SangamAccent,
    
    surface = Color.White,
    onSurface = SangamAccent,
    surfaceDim = Color(0xFFF5F2ED),
    surfaceBright = Color.White,
    
    error = Color(0xFFEF5350),
    onError = Color.White,
)

@Composable
fun IllakiyaTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) SangamDarkScheme else SangamLightScheme
    
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
