# Keep Expo Modules
-keep class expo.modules.** { *; }
-keep class versioned.host.exp.exponent.** { *; }

# Keep OkHttp (Network Client used by React Native & Expo)
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Keep React Native File System (if you use it)
-keep class com.rnfs.** { *; }

# Keep Generic React Native
-keep class com.facebook.react.** { *; }