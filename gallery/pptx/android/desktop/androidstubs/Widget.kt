// Compile-time stub. See AndroidStubs.kt.
@file:Suppress("UNUSED_PARAMETER", "unused")

package android.widget

import android.content.Context

class Toast {
    companion object {
        const val LENGTH_SHORT = 0
        const val LENGTH_LONG = 1
        fun makeText(context: Context, text: CharSequence, duration: Int): Toast = Toast()
    }

    fun show() {}
}
