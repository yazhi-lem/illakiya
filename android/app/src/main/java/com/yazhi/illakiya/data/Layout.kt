package com.yazhi.illakiya.data

import kotlinx.serialization.Serializable

@Serializable
data class Layout(
    val name: String,
    val rows: List<List<KeyDef>>
)

@Serializable
data class KeyDef(
    val id: String,
    val label: String,
    val output: String,
    val width: Float = 1.0f
)
