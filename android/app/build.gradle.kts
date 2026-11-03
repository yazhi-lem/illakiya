import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.gradle.internal.os.OperatingSystem

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// ---- Release versioning ---------------------------------------------------
// CI passes -PversionCode=<run number> -PversionName=<tag>; local builds use the defaults.
val illakiyaVersionCode = (findProperty("versionCode") as String?)?.toInt() ?: 3
val illakiyaVersionName = (findProperty("versionName") as String?) ?: "0.3.0"

// ---- Release signing (optional) ---------------------------------------------
// Provide all four to sign the release build; without them it builds unsigned.
val keystorePath: String? = System.getenv("ILLAKIYA_KEYSTORE_PATH")
val hasReleaseSigning = keystorePath != null &&
    listOf("ILLAKIYA_KEYSTORE_PASSWORD", "ILLAKIYA_KEY_ALIAS", "ILLAKIYA_KEY_PASSWORD")
        .all { !System.getenv(it).isNullOrEmpty() }

android {
    namespace = "com.yazhi.illakiya"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yazhi.illakiya"
        minSdk = 26
        targetSdk = 36
        versionCode = illakiyaVersionCode
        versionName = illakiyaVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(keystorePath!!)
                storePassword = System.getenv("ILLAKIYA_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ILLAKIYA_KEY_ALIAS")
                keyPassword = System.getenv("ILLAKIYA_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // JNA and the generated UniFFI bindings use reflection; keep R8 off
            // until the keep rules are verified on a device.
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    sourceSets["main"].java.srcDir(layout.buildDirectory.dir("generated/uniffi/kotlin"))
    sourceSets["main"].jniLibs.srcDir(layout.buildDirectory.dir("rustJniLibs"))
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

// ---- Rust core (core-rust) -> .so files + Kotlin bindings -----------------
// Needs: Rust, `cargo install cargo-ndk`, the Android Rust targets
// (rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android)
// and an NDK (ANDROID_NDK_HOME, or the NDK the Android SDK provides).
val coreDir = rootProject.projectDir.resolve("../core-rust").canonicalFile
val dataDir = rootProject.projectDir.resolve("../data").canonicalFile
val rustJniDir = layout.buildDirectory.dir("rustJniLibs")
val uniffiDir = layout.buildDirectory.dir("generated/uniffi/kotlin")
val rustAbis = listOf("arm64-v8a", "armeabi-v7a", "x86_64")
val hostLibName = when {
    OperatingSystem.current().isMacOsX -> "libillakiya_core.dylib"
    OperatingSystem.current().isWindows -> "illakiya_core.dll"
    else -> "libillakiya_core.so"
}

val buildRustAndroid by tasks.registering(Exec::class) {
    description = "Cross-compiles core-rust for Android ABIs with cargo-ndk."
    workingDir = coreDir
    inputs.dir(coreDir.resolve("src"))
    inputs.file(coreDir.resolve("Cargo.toml"))
    inputs.dir(dataDir)
    outputs.dir(rustJniDir)
    val outDir = rustJniDir.get().asFile.absolutePath
    commandLine(
        listOf("cargo", "ndk", "--platform", "26") +
            rustAbis.flatMap { listOf("-t", it) } +
            listOf("-o", outDir, "build", "--release", "--lib")
    )
    doFirst {
        if (System.getenv("ANDROID_NDK_HOME").isNullOrEmpty()) {
            environment("ANDROID_NDK_HOME", android.ndkDirectory.absolutePath)
        }
    }
}

val generateUniffiBindings by tasks.registering(Exec::class) {
    description = "Generates the Kotlin bindings for core-rust with UniFFI."
    workingDir = coreDir
    inputs.dir(coreDir.resolve("src"))
    inputs.file(coreDir.resolve("Cargo.toml"))
    inputs.file(coreDir.resolve("uniffi.toml"))
    outputs.dir(uniffiDir)
    val outDir = uniffiDir.get().asFile.absolutePath
    commandLine(
        "bash", "-c",
        "cargo build --release --lib && " +
            "cargo run --release --bin uniffi-bindgen -- generate " +
            "--library target/release/$hostLibName --language kotlin --out-dir '$outDir'"
    )
}

tasks.named("preBuild") {
    dependsOn(buildRustAndroid, generateUniffiBindings)
}

dependencies {
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.1")
    implementation("androidx.savedstate:savedstate-ktx:1.3.0")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation(platform("androidx.compose:compose-bom:2025.06.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-core")

    // UniFFI runtime
    implementation("net.java.dev.jna:jna:5.17.0@aar")

    testImplementation("junit:junit:4.13.2")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
