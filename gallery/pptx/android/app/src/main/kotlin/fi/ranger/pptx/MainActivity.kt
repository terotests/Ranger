package fi.ranger.pptx

import android.app.Activity
import android.content.Intent
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream

/**
 * The Android host: assets in, a [SlideView] on screen, and the two things the
 * viewer asks the platform for — a file to open, and a way back out of a show.
 *
 * There is no PowerPoint code in this file, and none anywhere else in this
 * directory. The ZIP reader, the OOXML parser, the theme resolver, the JPEG and
 * PNG decoders, the TrueType reader, the layout engine and the display list are
 * all `gallery/pptx/src`, compiled to Kotlin — the same source the
 * browser build, the SDL desktop host and the oracles run.
 */
class MainActivity : Activity() {

    private lateinit var view: SlideView

    /** Faces the viewer measures with, so it must draw with them too. */
    private val fontAssets = listOf(
        "fonts/OpenSans-Regular.ttf",
        "fonts/OpenSans-Bold.ttf",
        "fonts/OpenSans-Italic.ttf",
        "fonts/OpenSans-BoldItalic.ttf",
    )

    private val sampleDeck = "decks/sample.pptx"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        view = SlideView(this)
        // Hardware-accelerated, which is the default and is deliberately left
        // alone: on Android the accelerated `Canvas` IS the GPU path — Skia
        // draws it through Ganesh/Vulkan — and it brings glyph rasterisation,
        // path filling and antialiasing with it. The one thing it will not do
        // is a `BlurMaskFilter`, and `AndroidEvgSurface` draws its shadows'
        // falloff rather than filtering it precisely so that this line does not
        // have to become `setLayerType(LAYER_TYPE_SOFTWARE, null)`.
        setContentView(view)

        view.install(loadFaces())
        loadFonts()
        // Launched from Files, Drive or a mail attachment, or launched cold.
        val opened = intent?.takeIf { it.action == Intent.ACTION_VIEW }?.data?.let { openUri(it) } ?: false
        if (!opened) openAsset(sampleDeck)

        view.onFileRequest = { want -> if (want == "open") pickDeck() }
        view.onStateChanged = { title = titleLine() }
    }

    /**
     * Back leaves the show before it leaves the app — the same key Escape is on
     * a desktop. Deprecated on API 33+ in favour of an AndroidX dispatcher;
     * still delivered, and this host deliberately has no AndroidX at all.
     */
    @Deprecated("kept so the host needs no AndroidX dependency")
    override fun onBackPressed() {
        if (view.endShow()) return
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_OPEN, 0, "Open deck…")
        menu.add(0, MENU_PRESENT, 1, "Present")
        menu.add(0, MENU_NOTES, 2, "Notes")
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean = when (item.itemId) {
        MENU_OPEN -> { pickDeck(); true }
        MENU_PRESENT -> { view.startShow(); true }
        // The app's own command table, by the same dotted id the desktop
        // toolbar and the browser use.
        MENU_NOTES -> { view.run("view.notes"); true }
        else -> super.onOptionsItemSelected(item)
    }

    // --- the platform's part --------------------------------------------------

    private fun loadFaces(): FaceSet {
        // Typeface wants a file, and an asset is not one. Copying the four
        // faces into the cache once is cheaper than shipping them twice.
        val files = fontAssets.map { asset ->
            val out = File(cacheDir, asset.substringAfterLast('/'))
            if (!out.exists()) {
                assets.open(asset).use { input -> FileOutputStream(out).use { input.copyTo(it) } }
            }
            Typeface.createFromFile(out)
        }
        return FaceSet(files[0], files[1], files[2], files[3])
    }

    private fun loadFonts() {
        // The viewer measures with its own TrueType reader, so it needs the
        // bytes as well: the same four files, read once more.
        assets.open(fontAssets[0]).use { view.app.addFont("Open Sans", it.readBytes()) }
        for (face in fontAssets.drop(1)) {
            assets.open(face).use { view.app.addFace(it.readBytes()) }
        }
    }

    private fun openAsset(name: String) {
        runCatching { assets.open(name).use { it.readBytes() } }
            .onSuccess { openBytes(it, name.substringAfterLast('/')) }
            .onFailure { toast("no sample deck bundled") }
    }

    private fun openBytes(bytes: ByteArray, name: String) {
        if (!view.app.openDeck(bytes, name)) {
            toast("could not open $name")
            return
        }
        // The parser already pulled every picture out of the package, so the
        // bytes are on the model — nothing is fetched, and the store is rebuilt
        // per deck so the previous deck's pictures are not kept alive.
        val parts = HashMap<String, ByteArray>()
        for (part in view.app.imagePartNames()) {
            val data = view.app.imageBytes(part)
            if (data.isNotEmpty()) parts[part] = data
        }
        view.images.reset(parts)
        view.afterInput()
    }

    private fun pickDeck() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(
                Intent.EXTRA_MIME_TYPES,
                arrayOf(
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "application/octet-stream",
                ),
            )
        }
        startActivityForResult(intent, REQ_OPEN)
    }

    @Deprecated("startActivityForResult keeps this host free of AndroidX dependencies")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_OPEN || resultCode != RESULT_OK) return
        openUri(data?.data ?: return)
    }

    /** Bytes from anywhere the platform can name: a picker, a share, an attachment. */
    private fun openUri(uri: Uri): Boolean {
        val bytes = runCatching { contentResolver.openInputStream(uri)?.use { it.readBytes() } }.getOrNull()
        if (bytes == null || bytes.isEmpty()) {
            toast("could not read that file")
            return false
        }
        openBytes(bytes, uri.lastPathSegment?.substringAfterLast('/') ?: "deck.pptx")
        return view.app.loaded()
    }

    private fun titleLine(): String {
        val name = view.app.deckName().ifEmpty { "PPTX viewer" }
        return "$name  ${view.app.slideIndex() + 1}/${view.app.slideCount()}"
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    private companion object {
        const val REQ_OPEN = 1
        const val MENU_OPEN = 1
        const val MENU_PRESENT = 2
        const val MENU_NOTES = 3
    }
}
