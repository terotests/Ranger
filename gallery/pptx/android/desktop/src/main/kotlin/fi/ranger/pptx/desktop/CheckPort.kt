package fi.ranger.pptx.desktop

import fi.ranger.pptx.evg.EvgPainter
import fi.ranger.pptx.input.TouchRouter
import fi.ranger.pptx.rgr.PptxAndroid
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File

/**
 * The Android port, checked without Android.
 *
 * Two questions, and the second is the one that used to have no answer at all:
 *
 *  1. **Does the whole corpus draw?** Every `.pptx` fixture in the gallery is
 *     opened, every slide is laid out and painted, and a [RecordingSurface]
 *     records which kinds of command actually reached a surface. "Some ink
 *     appeared" is a weak check — a painter that had quietly stopped
 *     dispatching text would pass it — so the run also asserts that the corpus
 *     as a whole exercised text, borders, pictures, clipping, vector paths,
 *     gradients and shadows.
 *
 *  2. **Do touches do what they should?** [TouchRouter] holds every rule about
 *     what a finger means, so a tap on a slide thumbnail, a tap on a toolbar
 *     button, a flick over the page, a flick over the panel, and the whole of
 *     the show's tap / pinch / pan / double-tap interface can be driven here
 *     against a real deck. What is left in `SlideView` is `MotionEvent`
 *     unpacking, which is the only part that needs a device.
 *
 * Exit code 0 when everything passed. Every failure is printed with what was
 * expected and what happened.
 */
private val failures = mutableListOf<String>()
private var checks = 0

private fun check(name: String, ok: Boolean, detail: String = "") {
    checks++
    if (!ok) failures += if (detail.isEmpty()) name else "$name — $detail"
}

private fun checkEq(name: String, expected: Any?, actual: Any?) {
    check(name, expected == actual, "expected $expected, got $actual")
}

fun main(args: Array<String>) {
    if (args.isEmpty()) {
        System.err.println("usage: CheckPort <ranger-root> [out-dir]")
        kotlin.system.exitProcess(2)
    }
    val root = File(args[0])
    val outDir = File(args.getOrElse(1) { "tmp/pptx-android/coverage" }).apply { mkdirs() }

    coverage(root, outDir)
    touch(root)

    println()
    println("$checks checks, ${failures.size} failed")
    if (failures.isNotEmpty()) {
        println()
        for (f in failures) println("  FAIL  $f")
        kotlin.system.exitProcess(1)
    }
    println("the Android port's painter and touch routing both behave")
}

// ---------------------------------------------------------------- fonts / decks

private fun fontDir(root: File) = File(root, "gallery/pdf_writer/assets/fonts/Open_Sans")

private fun viewer(root: File, deck: File?, w: Int = 1280, h: Int = 800): PptxAndroid {
    val app = PptxAndroid()
    app.start(w, h)
    val fonts = fontDir(root)
    app.addFont("Open Sans", File(fonts, "OpenSans-Regular.ttf").readBytes())
    for (face in listOf("OpenSans-Bold.ttf", "OpenSans-Italic.ttf", "OpenSans-BoldItalic.ttf")) {
        app.addFace(File(fonts, face).readBytes())
    }
    if (deck != null && !app.openDeck(deck.readBytes(), deck.name)) {
        failures += "could not open ${deck.name}: ${app.status()}"
    }
    return app
}

private fun imagesOf(app: PptxAndroid): Map<String, ByteArray> {
    val parts = HashMap<String, ByteArray>()
    for (part in app.imagePartNames()) {
        val bytes = app.imageBytes(part)
        if (bytes.isNotEmpty()) parts[part] = bytes
    }
    return parts
}

// ---------------------------------------------------------------------- part 1

private fun coverage(root: File, outDir: File) {
    val fixtures = File(root, "gallery/pptx/fixtures")
        .listFiles { f -> f.name.endsWith(".pptx") }
        ?.sortedBy { it.name }
        ?: emptyList()

    check("fixtures are there", fixtures.size >= 25, "found ${fixtures.size}")
    println("rendering ${fixtures.size} fixture decks")
    println()
    println("  %-24s %6s %6s %6s %8s".format("deck", "slides", "cmds", "drawn", "ink"))

    val total = HashMap<String, Int>()
    var slidesRendered = 0

    for (deck in fixtures) {
        val app = viewer(root, deck)
        if (!app.loaded()) {
            failures += "${deck.name} did not load"
            continue
        }
        val images = imagesOf(app)
        val regular = File(fontDir(root), "OpenSans-Regular.ttf")

        var cmds = 0
        var drawn = 0
        var ink = 0
        val perDeck = HashMap<String, Int>()

        for (i in 0 until app.slideCount()) {
            app.gotoSlide(i)
            val list = app.frame()
            val img = BufferedImage(1280, 800, BufferedImage.TYPE_INT_RGB)
            val g = img.createGraphics()
            g.color = DESK
            g.fillRect(0, 0, img.width, img.height)
            val rec = RecordingSurface(AwtEvgSurface(g, images, mapOf("Open Sans" to regular)))
            val n = EvgPainter.paint(list, rec)
            g.dispose()

            cmds += list.count()
            drawn += n
            ink += countInk(img)
            slidesRendered++
            for ((k, v) in rec.calls) {
                perDeck[k] = (perDeck[k] ?: 0) + v
                total[k] = (total[k] ?: 0) + v
            }

            // One PNG per deck is enough to look at; the numbers are the test.
            if (i == 0) {
                javax.imageio.ImageIO.write(img, "png", File(outDir, deck.name.removeSuffix(".pptx") + ".png"))
            }
        }

        val name = deck.name.removeSuffix(".pptx")
        println("  %-24s %6d %6d %6d %8d".format(name, app.slideCount(), cmds, drawn, ink))
        check("$name: every slide draws something", drawn >= 5 * app.slideCount(), "drawn=$drawn over ${app.slideCount()} slides")
        check("$name: every slide has ink", ink >= 1000 * app.slideCount(), "ink=$ink")
        check("$name: the deck has text on it", (perDeck["drawTextRun"] ?: 0) > 0)
    }

    check("slides were rendered", slidesRendered >= 30, "rendered $slidesRendered")

    println()
    println("  what the corpus put through the painter:")
    for ((k, v) in total.entries.sortedByDescending { it.value }) {
        println("    %-16s %6d".format(k, v))
    }

    // The corpus has to exercise the painter, not just run it. Each of these is
    // a distinct branch in EvgPainter or in a surface, and a zero means either
    // the fixtures stopped covering it or the walk stopped dispatching it —
    // both worth a failed run.
    for (kind in listOf(
        "fillRect",        // RECT
        "strokeRect",      // BORDER
        "drawTextRun",     // TEXT
        "drawImage",       // IMAGE
        "fillPath",        // PATH — presets and custGeom as real curves
        "clipRect",        // PUSH_CLIP / POP_CLIP
        "roundedRect",     // a radius, which is its own code path on both surfaces
        "gradient",        // carried by no JSON, so this is the object path working
        "shadow",
        "boldText",
        "nonAsciiText",
    )) {
        check("the corpus exercises $kind", (total[kind] ?: 0) > 0, "count 0")
    }

    // What the corpus does NOT reach. These are real branches in the painter or
    // in a surface, and none of the 31 fixtures happens to produce one; saying
    // so out loud is the difference between a gap and a gap nobody knows about.
    // A fixture that covers one of these belongs in the list above.
    val uncovered = listOf(
        "strokePath" to "STROKE — a stroked vector outline (an open preset is filled today)",
        "multiRingPath" to "a path with a hole in it",
        "evenOddPath" to "an even-odd fill rule",
        "mirroredImage" to "a picture with flipH / flipV on it",
        "italicText" to "an italic run",
    ).filter { (total[it.first] ?: 0) == 0 }
    if (uncovered.isNotEmpty()) {
        println()
        println("  not reached by any fixture (the painter handles them; nothing asks):")
        for ((k, why) in uncovered) println("    %-16s %s".format(k, why))
    }

    // The painter opens a save for every PUSH_CLIP and for every rotated
    // command, and is responsible for closing both — including when a list ends
    // with its clip stack still open. So every save has exactly one restore,
    // and the saves are accounted for by those two reasons and nothing else.
    checkEq("every save was restored", total["save"] ?: 0, total["restore"] ?: 0)
    checkEq(
        "…and every save was a clip or a rotation",
        (total["clipRect"] ?: 0) + (total["rotate"] ?: 0),
        total["save"] ?: 0,
    )
}

private val DESK = Color(40, 44, 58)

private fun countInk(img: BufferedImage): Int {
    val desk = DESK.rgb and 0xFFFFFF
    var n = 0
    for (y in 0 until img.height) {
        for (x in 0 until img.width) {
            if ((img.getRGB(x, y) and 0xFFFFFF) != desk) n++
        }
    }
    return n
}

// ---------------------------------------------------------------------- part 2

private fun touch(root: File) {
    println()
    println("driving the touch router")

    val deck = File(root, "gallery/pptx/fixtures/20-business-deck.pptx")
    val density = 2f
    val appW = 1280
    val appH = 800

    fun router(): TouchRouter {
        val app = viewer(root, deck, appW, appH)
        val r = TouchRouter(app)
        r.density = density
        r.viewWidthPx = (appW * density).toInt()
        r.viewHeightPx = (appH * density).toInt()
        // The toolbar and the panel do not have geometry until a frame has been
        // laid out, and a host always paints before anyone can touch anything.
        app.frame()
        return r
    }

    // --- the coordinate conversion, which every case below depends on --------
    run {
        val r = router()
        checkEq("a view pixel maps through the density", 100, r.appX(200f))
        checkEq("…and so does y", 50, r.appY(100f))
        r.startShow()
        r.pinch(2f, 0f, 0f)
        // Zoomed in, the same pixel is half as far into the page. Leaving the
        // zoom out of this division is the classic version of this bug: taps
        // drift towards the top-left the further you are zoomed in.
        checkEq("zoom is in the conversion too", 50, r.appX(200f))
        checkEq("…on both axes", 25, r.appY(100f))
    }

    // --- a tap on a slide thumbnail ------------------------------------------
    run {
        val r = router()
        val pa = r.app.app
        check("the deck has slides to pick from", r.app.slideCount() >= 3)
        val x = (pa.panelThumbX() + pa.panelThumbW() / 2) * density
        val y = (pa.panelThumbY(2) + pa.panelThumbH() / 2) * density
        check("thumbnail 3 is on screen", pa.panelThumbY(2) > 0 && pa.panelThumbY(2) < appH)
        r.press(x, y)
        checkEq("a tap on the third thumbnail selects the third slide", 2, r.app.slideIndex())
    }

    // --- a tap on a toolbar button -------------------------------------------
    run {
        val r = router()
        val item = (0 until r.app.app.toolbar.items.size)
            .map { r.app.app.toolbar.items[it] }
            .firstOrNull { it.command == "slide.next" }
        check("the strip has a next-slide button", item != null)
        if (item != null) {
            check("the button has been laid out", item.w > 0 && item.h > 0, "w=${item.w} h=${item.h}")
            val before = r.app.slideIndex()
            r.press((item.x + item.w / 2) * density, (item.y + item.h / 2) * density)
            checkEq("a tap on the strip runs its command", before + 1, r.app.slideIndex())
        }
    }

    // --- the press has to reach the viewer at all ----------------------------
    //
    // The host's job is to deliver it, and the way that goes wrong is silent:
    // a `GestureDetector` whose `onDown` returns true reports every press as
    // handled, a host that believes it stops there, and the app never learns a
    // finger landed — the page still renders perfectly and nothing responds.
    // `pressTaken` is the viewer's own answer, so this is the check that the
    // press arrived rather than the check that the router ran.
    run {
        val r = router()
        val item = (0 until r.app.app.toolbar.items.size)
            .map { r.app.app.toolbar.items[it] }
            .firstOrNull { it.command == "slide.next" }
        check("the strip has a button to press", item != null)
        if (item != null) {
            r.down((item.x + item.w / 2) * density, (item.y + item.h / 2) * density)
            check("a press on the strip reaches the viewer", r.pressTaken())
            r.up((item.x + item.w / 2) * density, (item.y + item.h / 2) * density)
        }

        val pa = r.app.app
        r.down((pa.panelThumbX() + pa.panelThumbW() / 2) * density, (pa.panelThumbY(1) + pa.panelThumbH() / 2) * density)
        check("a press on the slide panel reaches the viewer", r.pressTaken())
        r.up((pa.panelThumbX() + pa.panelThumbW() / 2) * density, (pa.panelThumbY(1) + pa.panelThumbH() / 2) * density)
    }

    // --- flicks ---------------------------------------------------------------
    run {
        val r = router()
        val overPage = (r.app.slidePanelWidth() + 200) * density
        val overPanel = (r.app.slidePanelWidth() / 2) * density
        val pressY = 400f * density

        // `PptxApp` opens in edit mode, and there a press on the page starts a
        // drag or a rubber band — so the flick that follows it is the app's
        // gesture, not a page turn, or a swipe would leave an edit behind it.
        check("the viewer starts in edit mode", r.app.editing())
        r.down(overPage, pressY)
        check("…where a press on the page is the app's", r.pressTaken())
        check("…so a flick after it is not a page turn", !r.fling(overPage, -3000f, 0f))
        checkEq("…and the deck did not move", 0, r.app.slideIndex())
        r.up(overPage, pressY)

        // The host leaves edit mode on start-up; this is the same route.
        r.command("edit.toggle")
        check("the toggle leaves edit mode", !r.app.editing())

        r.down(overPage, pressY)
        check("…where the app takes nothing on the page", !r.pressTaken())
        check("a flick left turns the page", r.fling(overPage, -3000f, 0f))
        checkEq("…forwards", 1, r.app.slideIndex())
        r.up(overPage, pressY)

        r.down(overPage, pressY)
        check("a flick right turns it back", r.fling(overPage, 3000f, 0f))
        checkEq("…backwards", 0, r.app.slideIndex())
        r.up(overPage, pressY)

        check("a flick that starts over the panel is the panel's", !r.fling(overPanel, -3000f, 0f))
        checkEq("…so the deck did not move", 0, r.app.slideIndex())

        check("a mostly-vertical flick is a scroll", !r.fling(overPage, -300f, -3000f))
        checkEq("…so the deck did not move either", 0, r.app.slideIndex())

        check("a tap does nothing outside a show", !r.tap(overPage))
    }

    // --- the show -------------------------------------------------------------
    run {
        val r = router()
        r.startShow()
        check("the show started", r.app.presenting())
        checkEq("…on the slide that was open", 0, r.app.slideIndex())

        check("a tap on the right half goes on", r.tap(r.viewWidthPx * 0.75f))
        checkEq("…to the next slide", 1, r.app.slideIndex())

        check("a tap on the left half goes back", r.tap(r.viewWidthPx * 0.25f))
        checkEq("…to the previous one", 0, r.app.slideIndex())

        // Pinch, and the point under the fingers must stay under the fingers.
        val focusX = r.viewWidthPx * 0.5f
        val focusY = r.viewHeightPx * 0.5f
        val beforeX = r.appX(focusX)
        val beforeY = r.appY(focusY)
        check("a pinch zooms", r.pinch(2f, focusX, focusY))
        checkEq("…to the factor asked for", 2f, r.zoom)
        check(
            "…keeping the point under the fingers",
            kotlin.math.abs(r.appX(focusX) - beforeX) <= 1 && kotlin.math.abs(r.appY(focusY) - beforeY) <= 1,
            "was ($beforeX,$beforeY), now (${r.appX(focusX)},${r.appY(focusY)})",
        )

        check("a tap while zoomed does not turn the page", !r.tap(r.viewWidthPx * 0.75f))
        checkEq("…so the slide is the one being looked at", 0, r.app.slideIndex())

        val panBefore = r.panX
        check("a drag while zoomed pans", r.drag(200f, 0f))
        check("…in the direction dragged", r.panX > panBefore, "was $panBefore, now ${r.panX}")
        check("…and never off the page", r.panX >= 0f && r.panX <= r.app.width().toFloat())

        check("a drag cannot pan past the left edge", r.drag(-100000f, -100000f))
        checkEq("…so it stops at the origin", 0f, r.panX)
        checkEq("…on both axes", 0f, r.panY)

        r.pinch(100f, focusX, focusY)
        checkEq("a pinch cannot zoom past the limit", 6f, r.zoom)
        r.pinch(0.001f, focusX, focusY)
        checkEq("…nor below fitting the window", 1f, r.zoom)

        r.pinch(3f, focusX, focusY)
        check("a double tap goes back to fit", r.doubleTap())
        checkEq("…at zoom 1", 1f, r.zoom)
        checkEq("…with no pan left", 0f, r.panX)

        check("back leaves the show", r.endShow())
        check("…and the viewer is back", !r.app.presenting())
        check("back a second time is the activity's", !r.endShow())
    }

    // --- a show advances the build and the transition, not just the index -----
    run {
        val app = viewer(root, File(root, "gallery/pptx/fixtures/28-transitions.pptx"), appW, appH)
        val r = TouchRouter(app)
        r.density = density
        r.viewWidthPx = (appW * density).toInt()
        r.viewHeightPx = (appH * density).toInt()
        app.frame()
        r.startShow()
        check("the transitions deck presents", app.presenting())

        // This deck's first slide has a click-through build on it, and that is
        // the whole point of the case: during a show a tap walks the BUILD
        // first and only then moves on. `next()` is `presentNext` while
        // presenting for exactly this reason — the plain `nextSlide` would jump
        // straight to slide two with the build already finished, which reads as
        // the deck's animations being ignored.
        val steps = app.app.presentation.slides[0].build.size
        check("the fixture has a build to walk", steps > 0, "steps=$steps")
        val right = r.viewWidthPx * 0.75f

        r.tap(right)
        checkEq("the first tap advanced the build, not the deck", 0, app.slideIndex())
        checkEq("…by one step", 1, app.app.presentStep)

        var taps = 1
        while (app.slideIndex() == 0 && taps < steps + 4) {
            r.tap(right)
            taps++
        }
        checkEq("a tap past the end of the build moves on", 1, app.slideIndex())
        checkEq("…once the build was walked", steps + 1, taps)
        // Moving between slides runs the slide's transition; the host drives it.
        check("…and started its transition", app.animating())
        check("…with time left on it", app.app.showLength > 0.0, "showLength=${app.app.showLength}")
        app.tick(5.0)
        checkEq("…which finishes on the host's clock", 0.0, app.app.showLength)
        // `animating` stays true here and should: this fixture's second slide
        // carries `advTm="4000"`, so the host still has a clock to run for the
        // auto-advance. A transition ending and a slide having nothing left to
        // do are different questions.
        check("…while the slide's own timer keeps the clock running", app.animating())

        // Back is a slide, not a step: a presenter means the slide before.
        r.tap(r.viewWidthPx * 0.25f)
        checkEq("a tap on the left half goes back a slide", 0, app.slideIndex())
    }

    // --- the pointer still reaches the app while not presenting --------------
    run {
        val r = router()
        val onSlide = (r.app.slidePanelWidth() + 300) * density
        check("a press on the page is delivered", r.down(onSlide, 400f * density))
        check("a move is delivered", r.move(onSlide + 20f, 400f * density))
        check("a release is delivered", r.up(onSlide + 20f, 400f * density))
        checkEq("…without turning the page", 0, r.app.slideIndex())
    }
}
