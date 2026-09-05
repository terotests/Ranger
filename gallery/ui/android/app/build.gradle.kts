plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "fi.ranger.ui"
    compileSdk = 34

    defaultConfig {
        applicationId = "fi.ranger.ui"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
    }

    buildTypes {
        release {
            // The page is one generated file of ~46k lines and a few thousand
            // small classes. Nothing in it is reflective, but nothing is
            // stripped by default either, so shrinking stays off until there is
            // a reason: a mis-shrunk layout engine fails as a wrong page rather
            // than as a crash, which is a bad thing to debug.
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
        // The display-list painter, the surface interface and the
        // `android.graphics` backend. Not this port's: `gallery/evg/android` is
        // EVG's Android/JVM backend, and the pptx port compiles the same files.
        "../../../evg/android/src/main/kotlin",
        "../../../evg/android/src/android/kotlin",
        // The page itself: Ranger compiled to Kotlin by
        // `scripts/build-ranger.sh`. Generated, not checked in.
        "../generated",
    )
}

dependencies {
    // Deliberately none. The page is Ranger compiled to Kotlin and the host is
    // two files against the platform SDK; an AndroidX dependency here would be
    // a dependency on nothing this app uses.
}

// A build that silently produces an APK without the page in it is the one
// failure mode worth guarding: the generated source set would simply be empty
// and `DashboardView` would fail to resolve `UiAndroid` — an error a long way
// from its cause.
tasks.register("checkGeneratedPage") {
    doFirst {
        val generated = file("../generated/ui_android.kt")
        if (!generated.exists()) {
            throw GradleException(
                "gallery/ui/android/generated/ui_android.kt is missing.\n" +
                    "Run: bash gallery/ui/android/scripts/build-ranger.sh",
            )
        }
    }
}

tasks.matching { it.name.startsWith("compile") }.configureEach {
    dependsOn("checkGeneratedPage")
}
