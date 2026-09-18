// Compile-time stub. See AndroidStubs.kt.
//
// The input-method half of the platform, as far as the RealTrainer host uses
// it: the connection a soft keyboard commits text through, the attributes a
// view fills in for it, and the manager that shows and hides it.
@file:Suppress("UNUSED_PARAMETER", "unused")

package android.view.inputmethod

import android.os.IBinder
import android.view.KeyEvent
import android.view.View

interface InputConnection {
    fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean
    fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean
    fun setComposingText(text: CharSequence?, newCursorPosition: Int): Boolean
    fun finishComposingText(): Boolean
    fun sendKeyEvent(event: KeyEvent): Boolean
}

open class BaseInputConnection(targetView: View, fullEditor: Boolean) : InputConnection {
    override fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean = true
    override fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean = true
    override fun setComposingText(text: CharSequence?, newCursorPosition: Int): Boolean = true
    override fun finishComposingText(): Boolean = true
    override fun sendKeyEvent(event: KeyEvent): Boolean = true
}

class EditorInfo {
    companion object {
        const val TYPE_CLASS_TEXT = 1
        const val TYPE_TEXT_FLAG_NO_SUGGESTIONS = 0x80000
        const val IME_ACTION_NONE = 1
        const val IME_FLAG_NO_EXTRACT_UI = 0x10000000
    }

    @JvmField var inputType: Int = 0
    @JvmField var imeOptions: Int = 0
}

class InputMethodManager {
    fun showSoftInput(view: View, flags: Int): Boolean = true
    fun hideSoftInputFromWindow(windowToken: IBinder?, flags: Int): Boolean = true
    fun restartInput(view: View) {}
}
