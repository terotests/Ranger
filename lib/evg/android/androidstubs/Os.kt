// Compile-time stub. See AndroidStubs.kt.
package android.os

class Bundle

interface IBinder

/**
 * Enough of `Build` for an API check. The hosts gate on `SDK_INT` where a
 * platform feature is newer than `minSdk`, and a stub that did not have it
 * would make those branches unverifiable — which is the one thing this
 * directory exists to prevent.
 */
object Build {
    // What `DashboardView.onEmulator` reads to keep a software GPU from being
    // asked to run a full-screen shader.
    @JvmField val FINGERPRINT: String = "stub"
    @JvmField val HARDWARE: String = "stub"
    @JvmField val MODEL: String = "stub"

    object VERSION {
        @JvmField val SDK_INT: Int = 34
    }

    object VERSION_CODES {
        const val LOLLIPOP = 21
        const val S = 31
        const val TIRAMISU = 33
    }
}
