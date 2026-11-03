# UniFFI bindings + JNA (only used if minification is turned on)
-keep class com.yazhi.illakiya.core.** { *; }
-keep class com.sun.jna.** { *; }
-keepclassmembers class * extends com.sun.jna.** { public *; }
-dontwarn com.sun.jna.**
-dontwarn java.awt.**
