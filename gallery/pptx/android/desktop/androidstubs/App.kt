// Compile-time stub. See AndroidStubs.kt.
@file:Suppress("UNUSED_PARAMETER", "unused")

package android.app

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View

open class Activity : Context() {
    companion object {
        const val RESULT_OK = -1
        const val RESULT_CANCELED = 0
    }

    var title: CharSequence = ""
    val intent: Intent? = null

    protected open fun onCreate(savedInstanceState: Bundle?) {}
    fun setContentView(view: View) {}
    fun startActivityForResult(intent: Intent, requestCode: Int) {}
    open fun onCreateOptionsMenu(menu: Menu): Boolean = false
    open fun onOptionsItemSelected(item: MenuItem): Boolean = false
    protected open fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {}
    open fun onBackPressed() {}
}
