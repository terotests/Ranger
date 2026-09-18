// Compile-time stub. See AndroidStubs.kt.
@file:Suppress("UNUSED_PARAMETER", "unused")

package android.content

import android.content.res.AssetManager
import android.content.res.Resources
import android.net.Uri

open class Context {
    companion object {
        const val INPUT_METHOD_SERVICE = "input_method"
    }

    val assets: AssetManager = AssetManager()
    val cacheDir: java.io.File = java.io.File(".")
    val contentResolver: ContentResolver = ContentResolver()
    open val resources: Resources = Resources()
    open fun getSystemService(name: String): Any? = null
}

class ContentResolver {
    fun openInputStream(uri: Uri): java.io.InputStream? = null
}

class Intent() {
    constructor(action: String) : this()

    companion object {
        const val ACTION_OPEN_DOCUMENT = "android.intent.action.OPEN_DOCUMENT"
        const val ACTION_VIEW = "android.intent.action.VIEW"
        const val CATEGORY_OPENABLE = "android.intent.category.OPENABLE"
        const val EXTRA_MIME_TYPES = "android.intent.extra.MIME_TYPES"
    }

    var type: String? = null
    var data: Uri? = null
    val action: String? = null
    fun addCategory(category: String): Intent = this
    fun putExtra(name: String, value: Array<String>): Intent = this
}
