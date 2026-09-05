package fi.ranger.ui.desktop

import fi.ranger.evg.AwtEvgSurface
import fi.ranger.evg.AwtFaces
import fi.ranger.evg.AwtTextMeasurer
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.RecordingSurface
import fi.ranger.rgr.EVGElement
import fi.ranger.rgr.UiAndroid
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

/**
 * The dashboard port, driven off-device.
 *
 * The Android half of this port is two files and both need a device. Everything
 * *underneath* them does not: the demo is Ranger compiled to Kotlin, the walk is
 * [EvgPainter], and [AwtEvgSurface] paints the same display list with Java2D on
 * any JVM. So the questions a device would answer are asked here instead.
 *
 * **Does the page draw?** The frame is painted through a [RecordingSurface] that
 * counts what was dispatched. "Some ink appeared" is a weak check — a painter
 * that had quietly stopped drawing text would pass it — so the run asserts that
 * the page reaches text, borders, rounded boxes, clipping and vector paths, that
 * the chart contributed commands of its own, and that every `save` was restored.
 *
 * **Does the viewport arithmetic hold?** `UiAndroid` owns the one thing this
 * port adds to the demo: a fixed-width document on a screen that is not 1336
 * wide. The scale, the page height a screen is worth, the pinch that has to hold
 * the point under the fingers still, and the pan that must not leave the page
 * are all checked here — in the same generated Kotlin the app runs, not in a
 * second implementation of the same sums.
 *
 * **Do presses land?** Screen coordinates in, a test id out, and the page
 * changes: a tap on a sidebar link moves `aria-current`, a tap on a range button
 * selects it. That is the whole of what a finger does on this page, and it is
 * the part a host gets silently wrong by handing the hit test the wrong
 * coordinate space.
 *
 * What is left unchecked is the platform delegation: `AndroidEvgSurface` calling
 * `android.graphics.Canvas`, and `DashboardView` unpacking a `MotionEvent`.
 * `scripts/typecheck-host.sh` at least says both compile.
 */
object CheckDashboard {

    private var passed = 0
    private var failed = 0

    /**
     * The JDK's own sans, measured AND painted: `AwtTextMeasurer` is installed
     * from this before any page is made, and every surface below paints with
     * it, so the check asserts about one face rather than two.
     */
    private val faces = AwtFaces(emptyMap())

    private fun ok(what: String, cond: Boolean, detail: String = "") {
        if (cond) {
            passed++
            println("  PASS $what")
        } else {
            failed++
            println("  FAIL $what" + if (detail.isEmpty()) "" else "  ($detail)")
        }
    }

    /**
     * An element's laid-out box, by test id. The demo's own `findEl` over the
     * demo's own tree — the facade holds neither, and a check that measured
     * the picture instead would be asserting pixels rather than layout.
     */
    private fun boxOf(app: UiAndroid, id: String): EVGElement? {
        val root = app.app.root ?: return null
        val el = app.app.findEl(root, id)
        return if (el.id.isEmpty()) null else el
    }

    private fun heightOf(app: UiAndroid, id: String): Double = boxOf(app, id)?.calculatedHeight ?: -1.0

    /** What inside this element is drawn past its bottom edge, if anything. */
    private fun overflowing(app: UiAndroid, id: String): String {
        val box = boxOf(app, id) ?: return "no such element: $id"
        val bottom = box.calculatedY + box.calculatedHeight
        val out = StringBuilder()
        fun walk(el: EVGElement) {
            for (k in el.children) {
                val kb = k.calculatedY + k.calculatedHeight
                if (kb > bottom + 0.5) out.append("${k.className} ends ${"%.0f".format(kb)} past ${"%.0f".format(bottom)}; ")
                walk(k)
            }
        }
        walk(box)
        return out.toString()
    }

    /** Doubles that came out of the same arithmetic twice, not out of a spec. */
    private fun near(a: Double, b: Double, eps: Double = 0.5) = Math.abs(a - b) <= eps

    @JvmStatic
    fun main(args: Array<String>) {
        val root = File(args.getOrElse(0) { "." })
        val css = File(root, "gallery/ui/demo/dashboard.css")
        if (!css.isFile) {
            System.err.println("dashboard.css not found at ${css.path} — run this from the repository root")
            kotlin.system.exitProcess(3)
        }
        val out = File(root, "tmp/ui-android").apply { mkdirs() }

        // A tablet in landscape, in density-independent pixels. The page is
        // 1336 wide, so this is very nearly 1:1 — which is the size this demo
        // was drawn for and the profile the run-emulator script prefers.
        AwtTextMeasurer.install(faces)
        val app = UiAndroid()
        app.start(1280.0, 800.0, css.readText())

        println("--- the page, laid out and painted ---")
        val scale = app.scale()
        ok("the page is scaled to fit the screen's width", near(scale * app.pageWidth(), 1280.0))
        ok(
            "and the viewport is what that screen is worth in page pixels",
            near(app.pageHeight(), 800.0 / scale),
        )
        ok("the stylesheet parsed", app.styleErrorCount() == 0)
        if (app.styleErrorCount() > 0) {
            for (i in 0 until app.styleErrorCount()) println("      ${app.styleErrorAt(i)}")
        }

        val frame = app.frame()
        ok("the frame has commands in it", frame.cmds.size > 200)
        ok("and the chart is some of them", app.chartCommandCount() > 20)

        val png = paint(app, out, "dashboard.png")
        println("      " + png.calls.entries.sortedBy { it.key }.joinToString("  ") { "${it.key}=${it.value}" })
        ok("text was drawn", png.count("drawTextRun") > 100)
        ok("boxes were filled", png.count("fillRect") > 40)
        ok("borders were stroked", png.count("strokeRect") > 10)
        ok("corners were rounded", png.count("roundedRect") > 10)
        ok("the scroll region clipped", png.count("clipRect") > 0)
        // The sidebar's icons are lucide's, which are STROKED outlines rather
        // than filled silhouettes, and so is the chart's line; the one filled
        // path is the area under it. A port that had dropped `strokePath` —
        // which no pptx fixture reaches, so nothing else here would notice —
        // would draw this page with an empty sidebar and a flat chart.
        ok("the chart's area was filled", png.count("fillPath") > 0)
        ok("the icons and the chart's line were stroked", png.count("strokePath") > 20)
        ok("every save was restored", png.count("save") == png.count("restore"))
        // What no part of this page reaches is worth printing rather than
        // leaving silent: it is the list of things the Android surface is
        // carrying untested.
        for (kind in listOf("drawImage", "gradient", "shadow", "rotate", "italicText")) {
            if (png.count(kind) == 0) println("      (not reached by this page: $kind)")
        }

        println("--- what a finger does ---")
        // The sidebar's Analytics link, found the way the app finds it: hit
        // test at a screen coordinate. 1:1-ish here, but the conversion is
        // still the app's.
        val before = app.navPage()
        val analytics = pressUntil(app, "db-nav-analytics")
        ok("a tap reaches a sidebar link", analytics)
        ok("and the page it names is the page you are on", app.navPage() == "analytics" && before != "analytics")

        val backHome = pressUntil(app, "db-nav-dashboard")
        ok("and back again", backHome && app.navPage() == "dashboard")

        ok("a tap on a range button is answered", pressUntil(app, "db-range-d30"))
        // Selecting a range rebuilds the chart, so the frame is not the frame
        // it was — which is the only observable difference a check can make
        // without asserting an outline.
        ok("and the chart is redrawn for it", app.chartCommandCount() > 20)

        println("--- scrolling, and where it stops ---")
        app.releasePress()
        val travel = app.maxScroll()
        ok("there is more page than screen", travel > 100.0)
        ok("a drag scrolls", app.scrollByScreen(200.0) && app.scrollTop() > 0.0)
        // The demo clamps to its own content height. A host that had handed it
        // the wrong viewport would stop somewhere else, and this is the number
        // that catches it.
        app.scrollByScreen(100000.0)
        ok("and it stops at the bottom rather than past it", near(app.scrollTop(), travel, 1.0))
        ok("scrolling back up returns to the top", app.scrollByScreen(-100000.0) && app.scrollTop() == 0.0)

        println("--- zoom and pan ---")
        ok("nothing is panned at rest", app.panX() == 0.0 && app.maxPanX() == 0.0)
        val fit = app.scale()
        // The point under the fingers has to stay under the fingers. Pinching
        // about the origin instead is the classic version of this bug, and it
        // is invisible in the middle of the screen and obvious at the edge.
        val focus = 1000.0
        val pageUnderFocus = app.toPageX(focus)
        ok("a pinch zooms", app.pinch(2.0, focus, 400.0) && app.zoom() == 2.0)
        ok("and the scale follows it", near(app.scale(), fit * 2.0, 0.001))
        ok("the point under the fingers stayed there", near(app.toPageX(focus), pageUnderFocus, 0.5))
        ok("zoomed in, there is now something to pan", app.maxPanX() > 0.0)
        ok("panning past the left edge is refused", !app.panBy(10000.0) || app.panX() == 0.0)
        app.panBy(-100000.0)
        ok("and past the right edge it stops at the edge", near(app.panX(), app.maxPanX(), 0.001))
        ok("a zoomed page is a shorter viewport", app.pageHeight() < 800.0 / fit)
        ok("a double tap puts it back", app.resetZoom() && app.zoom() == 1.0 && app.panX() == 0.0)
        ok("the viewport came back with it", near(app.pageHeight(), 800.0 / fit))

        println("--- a hit test after all that ---")
        // The coordinate conversion is the same code the pinch just moved
        // about, so this is the check that it was left in a usable state.
        ok("presses still land", pressUntil(app, "db-nav-team") && app.navPage() == "team")

        println("--- the keys an emulator has ---")
        // The host maps a KEYCODE to the name the browser uses and hands it
        // over; everything a key MEANS is the demo's. What is worth checking
        // here is that the names the host sends are names the demo answers to,
        // because a typo in that table is silent — the page simply ignores the
        // keyboard, which is also what a page with no keyboard support does.
        // Back to the long page: the check above left the app on Team, which
        // is four cards tall and has nothing to scroll — a PageDown that
        // answers "nothing moved" there is the honest answer, not a bug.
        pressUntil(app, "db-nav-dashboard")
        app.scrollByScreen(-100000.0)
        ok("PageDown scrolls the page", app.key("PageDown") && app.scrollTop() > 0.0)
        ok("Home goes back to the top", app.key("Home") && app.scrollTop() == 0.0)
        ok("End goes to the bottom", app.key("End") && near(app.scrollTop(), app.maxScroll(), 1.0))
        app.key("Home")

        println("--- the surface's ripple ---")
        // The effect itself is a shader over the finished pixels and only a
        // device can show it. What CAN be checked here is everything the host
        // hands that shader: where a touch landed in PAGE coordinates, how the
        // ages advance, and when the page goes quiet — which is the part a host
        // gets wrong by handing the shader screen pixels, or by ageing touches
        // on a clock that never stops.
        val fresh = UiAndroid()
        fresh.start(1280.0, 800.0, css.readText())
        ok("nothing is rippling at rest", fresh.dropCount() == 0 && !fresh.busy())

        fresh.rippleAt(640.0, 400.0)
        ok("a touch makes a drop", fresh.dropCount() == 1)
        ok(
            "at the page point under the finger, not the screen point",
            near(fresh.dropX(0), fresh.toPageX(640.0), 0.01) &&
                near(fresh.dropY(0), fresh.toPageY(400.0), 0.01),
        )
        ok("and the page is busy while it lives", fresh.busy())
        ok("a new touch starts at zero", near(fresh.dropAge(0), 0.0, 0.001))

        ok("a tick ages it", fresh.tick(50.0) && near(fresh.dropAge(0), 0.05, 0.001))
        // And a step nobody believes is CLAMPED rather than skipped: at most one
        // slow frame's worth, 64ms, however long the frame really took.
        val aged = fresh.dropAge(0)
        fresh.tick(5000.0)
        ok(
            "a frame that arrived a second late ages by one slow frame, not a second",
            near(fresh.dropAge(0) - aged, 0.064, 0.001),
            "${fresh.dropAge(0) - aged}",
        )

        // A drag leaves a WAKE — one source every 26 page pixels rather than
        // one that follows the finger, because a wake is a row of sources.
        fresh.rippleTo(645.0, 400.0)
        ok("a small move adds nothing", fresh.dropCount() == 1)
        fresh.rippleTo(700.0, 400.0)
        ok("a real one adds a source", fresh.dropCount() == 2)
        fresh.rippleEnd()
        fresh.rippleTo(900.0, 400.0)
        ok("and a lifted finger leaves none", fresh.dropCount() == 2)

        // Zoomed in, the same screen point is a different page point, and the
        // drop has to follow the page or the ring appears away from the finger.
        fresh.pinch(2.0, 640.0, 400.0)
        fresh.rippleAt(640.0, 400.0)
        val last = fresh.dropCount() - 1
        ok(
            "a touch on a zoomed page still lands under the finger",
            near(fresh.dropX(last), fresh.toPageX(640.0), 0.01),
        )
        fresh.resetZoom()

        // Every drop dies with its own decay: three seconds is the renderer's
        // own threshold, and the page has to go quiet on its own or the host
        // asks for frames forever.
        var spun = 0
        while (fresh.busy() && spun < 400) {
            fresh.tick(16.0)
            spun++
        }
        ok("they all retire", fresh.dropCount() == 0)
        // The rule that hung an emulator, as a check. A frame clock that
        // reports something impossible — a second between frames, or nothing
        // at all — must still ADVANCE, because a page that cannot go quiet
        // keeps a shader over every pixel of it running for as long as the app
        // is open. Clamping does that; skipping the step does not.
        fresh.rippleAt(400.0, 300.0)
        var stubborn = 0
        while (fresh.busy() && stubborn < 500) {
            fresh.tick(9000.0)
            stubborn++
        }
        ok("a clock that jumps a second at a time still ends it", !fresh.busy())
        fresh.rippleAt(400.0, 300.0)
        var frozen = 0
        while (fresh.busy() && frozen < 5000) {
            fresh.tick(0.0)
            frozen++
        }
        ok("and so does one that reports no time at all", !fresh.busy())
        ok("so the page goes quiet without being told to", !fresh.busy())
        ok("and it took about three seconds", spun in 150..250, "$spun frames of 16ms")


        println("--- a screen taller than the page ---")
        // A tablet in PORTRAIT: 800dp wide scales the page by 0.6, so the
        // screen is worth 2137 page pixels — more than the dashboard's own
        // content and more than the 1420 the stylesheet used to state as the
        // height of the page, the sidebar and the hairline. That constant was
        // the page's height before it scrolled, and it looked full only
        // because every viewport it had been shown in was shorter than it. On
        // this one the sidebar stopped two thirds of the way down and the rest
        // of the screen was the host's own background.
        val tall = UiAndroid()
        tall.start(800.0, 1280.0, css.readText())
        tall.frame()
        ok("the viewport is taller than the page's content", tall.pageHeight() > 2000.0)
        ok(
            "the page fills it",
            near(heightOf(tall, "page"), tall.pageHeight(), 1.0),
            "${heightOf(tall, "page")} vs ${tall.pageHeight()}",
        )
        ok(
            "and so does the sidebar",
            near(heightOf(tall, "db-side"), tall.pageHeight(), 1.0),
            "${heightOf(tall, "db-side")} vs ${tall.pageHeight()}",
        )
        // The account row rides the bottom edge, wherever that edge is:
        // `.db-side-body` is `flex: 1` and this is the check that it still is.
        val user = boxOf(tall, "db-user")
        ok(
            "the account row is at the bottom of it",
            user != null && tall.pageHeight() - (user.calculatedY + user.calculatedHeight) < 24.0,
        )
        paint(tall, out, "dashboard-portrait.png")

        println("--- a phone, and a rotation ---")
        val phone = UiAndroid()
        phone.start(411.0, 823.0, css.readText())
        ok("the same page fits a phone by scaling down", phone.scale() < 0.35)
        ok("and its viewport is taller in page pixels than the tablet's", phone.pageHeight() > 2000.0)
        val phoneFrame = phone.frame()
        ok("and it still draws", phoneFrame.cmds.size > 200)
        paint(phone, out, "dashboard-phone.png")
        phone.resize(823.0, 411.0)
        ok("a rotation re-fits it", near(phone.scale() * phone.pageWidth(), 823.0))
        ok("and it still draws after that", phone.frame().cmds.size > 200)
        // The SHORTEST viewport in this run — a phone on its side is 667 page
        // pixels tall — and the one the sidebar's height now follows. It used
        // to be a constant taller than any of them, so nothing in the column
        // could overflow it; now the column is the viewport and the check has
        // to say that the brand, the links and the account row still fit.
        val over = overflowing(phone, "db-side")
        ok("and the sidebar's own rows fit in the shortest screen here", over.isEmpty(), over)

        println()
        println("$passed checks, $failed failed")
        println("PNGs in ${out.path}/")
        if (failed > 0) kotlin.system.exitProcess(1)
        println("the dashboard port paints and answers a finger")
    }

    /**
     * Press the element with this id, by finding it on the screen the way a
     * finger would: walk the frame's own text and box commands is not enough —
     * the id is not in the display list — so this asks the hit test at a grid
     * of screen points and presses the first one that answers with the id.
     *
     * That is deliberately the app's whole input path (screen point → page
     * point → hit test → press) rather than a call to `press(id)`, because the
     * conversion is the part this port adds and therefore the part worth
     * checking.
     */
    private fun pressUntil(app: UiAndroid, id: String): Boolean {
        var x = 6.0
        while (x < 1280.0) {
            var y = 6.0
            while (y < 800.0) {
                if (app.hitAt(x, y) == id) {
                    app.pressAt(x, y)
                    return true
                }
                y += 12.0
            }
            x += 12.0
        }
        return false
    }

    private fun paint(app: UiAndroid, dir: File, name: String): RecordingSurface {
        val scale = app.scale()
        val list = app.frame()
        val w = Math.ceil(app.pageWidth() * scale).toInt()
        val h = Math.ceil(app.pageHeight() * scale).toInt()
        val img = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
        val g = img.createGraphics()
        g.color = Color.WHITE
        g.fillRect(0, 0, w, h)
        g.scale(scale, scale)
        g.translate(-app.panX(), 0.0)
        // No font files: EVG measured this page with its own estimate rather
        // than a face, exactly as the browser build does, so handing the
        // surface a real TrueType file here would make the picture *less* like
        // the one the demo is checked against. The platform's sans is the
        // honest choice on both surfaces.
        val rec = RecordingSurface(AwtEvgSurface(g, emptyMap(), faces))
        EvgPainter.paint(list, rec)
        g.dispose()
        ImageIO.write(img, "png", File(dir, name))
        println("  ${dir.path}/$name  ${w}x$h, ${list.cmds.size} commands")
        return rec
    }
}
