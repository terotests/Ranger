package fi.ranger.pptx.desktop

import fi.ranger.evg.AwtEvgSurface
import fi.ranger.evg.EvgPainter
import fi.ranger.rgr.PptxAndroid
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

/**
 * The Android port, run without Android.
 *
 * Everything above the last page of platform delegation is the same objects the
 * phone runs: the Ranger viewer compiled to Kotlin, the shared `EvgPainter`,
 * the same facade calls in the same order the `SlideView` makes them. Only the
 * surface differs — Java2D instead of `android.graphics` — and only because
 * nothing in CI has a device to draw on.
 *
 *     kotlin -cp … fi.ranger.pptx.desktop.RenderDeckKt <ranger-root> <deck.pptx> <out-dir> [w] [h]
 *
 * …or, from the repository root: `bash gallery/pptx/android/scripts/verify-desktop.sh`.
 *
 * Writes one PNG per slide, prints a line per slide, and exits non-zero if a
 * slide draws nothing — a black page and a crash look the same in a PNG, so the
 * count is the test.
 */
fun main(args: Array<String>) {
    if (args.size < 3) {
        System.err.println("usage: RenderDeck <ranger-root> <deck.pptx> <out-dir> [width] [height]")
        kotlin.system.exitProcess(2)
    }
    val root = File(args[0])
    val deckFile = File(args[1])
    val outDir = File(args[2]).apply { mkdirs() }
    val width = args.getOrNull(3)?.toIntOrNull() ?: 1280
    val height = args.getOrNull(4)?.toIntOrNull() ?: 800

    val fontDir = File(root, "gallery/pdf_writer/assets/fonts/Open_Sans")
    val regular = File(fontDir, "OpenSans-Regular.ttf")

    // The same three calls MainActivity makes, in the same order: size first
    // (the viewer lays out against it), then the faces, then the deck.
    val app = PptxAndroid()
    app.start(width, height)
    require(app.addFont("Open Sans", regular.readBytes())) { "the regular face was refused" }
    for (face in listOf("OpenSans-Bold.ttf", "OpenSans-Italic.ttf", "OpenSans-BoldItalic.ttf")) {
        require(app.addFace(File(fontDir, face).readBytes())) { "$face was refused" }
    }
    require(app.openDeck(deckFile.readBytes(), deckFile.name)) { "the deck would not open: ${app.status()}" }

    val images = HashMap<String, ByteArray>()
    for (part in app.imagePartNames()) {
        val bytes = app.imageBytes(part)
        if (bytes.isNotEmpty()) images[part] = bytes
    }

    println("deck=${app.deckName()} slides=${app.slideCount()} images=${images.size} status=${app.status()}")

    var failed = 0
    for (i in 0 until app.slideCount()) {
        app.gotoSlide(i)
        // The two numbers a host cares about: how long the viewer takes to
        // answer with a frame, and how long it takes to paint one. Both are per
        // slide change, not per frame — a still slide is not repainted.
        val t0 = System.nanoTime()
        val list = app.frame()
        val t1 = System.nanoTime()
        val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
        val g = img.createGraphics()
        g.color = Color(40, 44, 58)
        g.fillRect(0, 0, width, height)
        val surface = AwtEvgSurface(g, images, mapOf("Open Sans" to regular))
        val drawn = EvgPainter.paint(list, surface)
        g.dispose()
        val t2 = System.nanoTime()
        val out = File(outDir, "slide-%02d.png".format(i + 1))
        ImageIO.write(img, "png", out)
        val nonBackground = countNonBackground(img)
        println(
            "slide ${i + 1}: cmds=${list.count()} drawn=$drawn ink=$nonBackground " +
                "build=%.1fms paint=%.1fms -> %s".format(
                    (t1 - t0) / 1e6, (t2 - t1) / 1e6, out.name,
                ),
        )
        // A slide that paints only the desk colour did not paint the slide.
        if (drawn < 5 || nonBackground < 1000) failed++
    }
    if (failed > 0) {
        System.err.println("$failed slide(s) came out empty")
        kotlin.system.exitProcess(1)
    }
}

/** Pixels that are not the viewer's desk colour — how much actually got drawn. */
private fun countNonBackground(img: BufferedImage): Int {
    val desk = Color(40, 44, 58).rgb and 0xFFFFFF
    var n = 0
    for (y in 0 until img.height) {
        for (x in 0 until img.width) {
            if ((img.getRGB(x, y) and 0xFFFFFF) != desk) n++
        }
    }
    return n
}
