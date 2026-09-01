plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "fi.ranger.pptx"
    compileSdk = 34

    defaultConfig {
        applicationId = "fi.ranger.pptx"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
    }

    buildTypes {
        release {
            // The viewer is one generated file of ~91k lines and thousands of
            // small classes. R8 has no trouble with it, but nothing here is
            // reflective and nothing is stripped by default, so shrinking is
            // left off until there is a reason: a mis-shrunk parser fails as a
            // wrong slide rather than as a crash, which is a bad thing to debug.
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
    }

    sourceSets["main"].java.srcDirs(
        "src/main/kotlin",
        // This port's own input rules, shared with the desktop checks.
        "../common/src/main/kotlin",
        // The display-list painter, the surface interface and the
        // `android.graphics` backend. Not this port's: `gallery/evg/android` is
        // EVG's Android/JVM backend and the ui port compiles the same files.
        "../../../evg/android/src/main/kotlin",
        "../../../evg/android/src/android/kotlin",
        // The viewer itself: Ranger compiled to Kotlin by
        // `scripts/build-ranger.sh`. Generated, not checked in.
        "../generated",
    )
}

dependencies {
    // Deliberately none. The viewer is Ranger compiled to Kotlin and the host
    // is four files against the platform SDK; an AndroidX dependency here would
    // be a dependency on nothing this app uses.
}

// A build that silently produces an APK without the viewer in it is the one
// failure mode worth guarding: the generated source set would simply be empty
// and `MainActivity` would fail to resolve `PptxAndroid` — an error a long way
// from its cause.
tasks.register("checkGeneratedViewer") {
    doFirst {
        val generated = file("../generated/pptx_android.kt")
        if (!generated.exists()) {
            throw GradleException(
                "gallery/pptx/android/generated/pptx_android.kt is missing.\n" +
                    "Run: bash gallery/pptx/android/scripts/build-ranger.sh",
            )
        }
    }
}

tasks.matching { it.name.startsWith("compile") }.configureEach {
    dependsOn("checkGeneratedViewer")
}
