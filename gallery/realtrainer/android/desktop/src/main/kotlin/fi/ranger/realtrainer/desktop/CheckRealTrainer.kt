package fi.ranger.realtrainer.desktop

import fi.ranger.evg.AwtEvgSurface
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.RecordingSurface
import fi.ranger.rgr.EVGElement
import fi.ranger.rgr.RtAndroid
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

/**
 * The RealTrainer port, painted off-device.
 *
 * The facade's rules are checked on Node by `ranger/check_rt_android.rgr`;
 * what that run cannot do is PAINT. This one compiles the same generated
 * Kotlin the APK is built from, walks its frames with [EvgPainter] — the
 * painter the app uses — and paints them with [AwtEvgSurface] on a JVM. So
 * what a device would show is asked here: does every kind of command the page
 * uses reach a surface, and does a press through the same Kotlin land.
 *
 * What is left unchecked is the platform delegation: `AndroidEvgSurface`
 * calling `android.graphics.Canvas`, and `RealTrainerView` unpacking a
 * `MotionEvent` and talking to the input method. `scripts/typecheck-host.sh`
 * at least says both compile.
 */
object CheckRealTrainer {

    private var passed = 0
    private var failed = 0

    private fun ok(what: String, cond: Boolean, detail: String = "") {
        if (cond) {
            passed++
            println("  PASS $what")
        } else {
            failed++
            println("  FAIL $what" + if (detail.isEmpty()) "" else "  ($detail)")
        }
    }

    private fun near(a: Double, b: Double, eps: Double = 0.5) = Math.abs(a - b) <= eps

    private fun read(root: File, path: String): String {
        val f = File(root, path)
        return if (f.isFile) f.readText() else ""
    }

    @JvmStatic
    fun main(args: Array<String>) {
        val root = File(args.getOrElse(0) { "." })
        val css = read(root, "gallery/realtrainer/web/realtrainer.css")
        val compact = read(root, "gallery/realtrainer/fixtures/session.compact")
        if (css.isEmpty() || compact.isEmpty()) {
            System.err.println("realtrainer.css or session.compact not found under ${root.path} — run this from the repository root")
            kotlin.system.exitProcess(3)
        }
        val plan = read(root, "gallery/realtrainer/fixtures/machines/planDialog.machine.json")
        val chat = read(root, "gallery/realtrainer/fixtures/machines/chat.machine.json")
        val seed = read(root, "gallery/realtrainer/fixtures/reference/seed.json")
        val out = File(root, "tmp/rt-android").apply { mkdirs() }

        fun fresh(w: Double, h: Double): RtAndroid {
            val app = RtAndroid()
            app.start(w, h, css, compact, plan, chat, seed)
            return app
        }

        println("--- a phone, laid out and painted ---")
        // Pixel 8, less the status bar and the navigation bar, in dp.
        val phone = fresh(412.0, 843.0)
        ok("the page is the view", near(phone.pageWidth(), 412.0) && near(phone.pageHeight(), 843.0))
        ok("the stylesheet parsed", phone.styleErrorCount() == 0)
        for (i in 0 until phone.styleErrorCount()) println("      ${phone.styleErrorAt(i)}")
        ok("the phone opens on Home", phone.sectionName() == "home")
        paint(phone, out, "realtrainer-phone-plan.png")
        // The seed opens on its first calendar, the plan, as the browser does;
        // the diary is a route away, and Home over the diary is the feed.
        ok("the diary calendar opens on a route", phone.openRoute("/calendar/cal-train") && phone.sectionName() == "calendar")
        ok("and Koti over it is the feed", pressUntil(phone, "rt-nav-home", 412.0, 843.0) && phone.sectionName() == "home")
        val home = paint(phone, out, "realtrainer-phone-home.png")
        println("      " + home.calls.entries.sortedBy { it.key }.joinToString("  ") { "${it.key}=${it.value}" })
        ok("text was drawn", home.count("drawTextRun") > 20)
        ok("boxes were filled", home.count("fillRect") > 10)
        ok("corners were rounded", home.count("roundedRect") > 5)
        ok("the document clipped", home.count("clipRect") > 0)
        // The bottom bar's icons are stroked outlines; a port that had dropped
        // `strokePath` would draw the bar with four labels and no pictures.
        ok("the icons were stroked", home.count("strokePath") > 0)
        ok("every save was restored", home.count("save") == home.count("restore"))
        for (kind in listOf("drawImage", "gradient", "shadow", "rotate", "italicText")) {
            if (home.count(kind) == 0) println("      (not reached by this page: $kind)")
        }

        println("--- what a finger does ---")
        ok("a press reaches the calendar tab", pressUntil(phone, "rt-nav-calendar", 412.0, 843.0))
        ok("and the calendar is the section", phone.sectionName() == "calendar")
        paint(phone, out, "realtrainer-phone-calendar.png")
        ok("Koti takes the diary", pressUntil(phone, "rt-nav-home", 412.0, 843.0) && phone.sectionName() == "home")
        phone.pressAt(206.0, 600.0)
        ok("a drag scrolls the feed", phone.panBy(0.0, -200.0))
        ok("and the release changes nothing", phone.releasePress() && phone.sectionName() == "home")
        // Back to the top: the tabs scrolled off with the feed.
        phone.panBy(0.0, 100000.0)
        phone.releasePress()
        ok("the statistics tab is a press away", pressUntil(phone, "rt-home-tab-stats", 412.0, 843.0))
        val stats = paint(phone, out, "realtrainer-phone-stats.png")
        // The statistics are Vela charts: areas under lines. A frame without a
        // filled path is a Tilastot with nothing drawn on it.
        ok("the charts' areas were filled", stats.count("fillPath") > 0, "fillPath=${stats.count("fillPath")}")

        println("--- the keyboard ---")
        ok("AI Chat is a press away", pressUntil(phone, "rt-nav-chat", 412.0, 843.0))
        ok("a tap on the field takes the focus", pressUntil(phone, "rt-chat-field", 412.0, 843.0) && phone.focusedField() == "rt-chat-field")
        ok("the keyboard's text lands in it", phone.typeText("Maastaveto 3x5"))
        ok("and is drawn", paint(phone, out, "realtrainer-phone-chat.png").count("drawTextRun") > 5)
        // Under adjustResize the keyboard is a shorter view.
        phone.resize(412.0 , 480.0)
        ok("the keyboard shortens the view and the field keeps the focus", near(phone.pageHeight(), 480.0) && phone.focusedField() == "rt-chat-field")
        ok("a Backspace is a key", phone.key("Backspace", false, false))
        ok("the focus can be dropped", phone.blur() && phone.focusedField().isEmpty())

        println("--- a tablet ---")
        // Pixel Tablet in landscape, less the status bar.
        val pad = fresh(1280.0, 776.0)
        ok("the page is the tablet", near(pad.pageWidth(), 1280.0) && near(pad.pageHeight(), 776.0))
        ok("and the rail is there instead of the bar", pad.hitAt(28.0, 68.0) == "rt-nav-home")
        pad.openRoute("/calendar/cal-train")
        pressUntil(pad, "rt-nav-home", 1280.0, 776.0)
        val padFrame = paint(pad, out, "realtrainer-tablet.png")
        ok("it draws", padFrame.count("drawTextRun") > 20)
        pad.resize(800.0, 1256.0)
        ok("a rotation lays the page out again", near(pad.pageWidth(), 800.0))
        ok("and still draws", paint(pad, out, "realtrainer-tablet-portrait.png").count("drawTextRun") > 20)

        println("--- the clock ---")
        var spun = 0
        while (phone.tick(16.0) && spun < 600) spun++
        ok("the page goes quiet on its own", spun < 600, "$spun frames of 16ms")

        println()
        println("$passed checks, $failed failed")
        println("PNGs in ${out.path}/")
        if (failed > 0) kotlin.system.exitProcess(1)
        println("the RealTrainer port paints and answers a finger")
    }

    /**
     * Press the element with this id, at a VIEW point: the element's laid-out
     * box, from the demo's own tree, gives the point, and the press then goes
     * the app's whole input path — hit test at that point, press, release.
     * A grid scan would do the same without the tree, but every probe lays
     * the diary out again, and over seven hundred entries that is minutes on
     * a JVM for one press.
     */
    private fun pressUntil(app: RtAndroid, id: String, w: Double, h: Double): Boolean {
        app.app.laidOut()
        val root = app.app.root ?: return false
        // The shell holds the rail's and the bar's items under the same id;
        // the one the stylesheet hid at this width has no box.
        val el = visibleEl(root, id) ?: return false
        val x = el.calculatedX + el.calculatedWidth / 2.0
        val y = el.calculatedY + el.calculatedHeight / 2.0
        if (x < 0.0 || y < 0.0 || x > w || y > h) return false
        if (app.hitAt(x, y) != id) return false
        app.pressAt(x, y)
        app.releasePress()
        return true
    }

    private fun visibleEl(el: EVGElement, id: String): EVGElement? {
        if (el.id == id && el.calculatedWidth > 0.0 && el.calculatedHeight > 0.0) return el
        for (kid in el.children) {
            val found = visibleEl(kid, id)
            if (found != null) return found
        }
        return null
    }

    private fun paint(app: RtAndroid, dir: File, name: String): RecordingSurface {
        val list = app.frame()
        val w = Math.ceil(app.pageWidth()).toInt()
        val h = Math.ceil(app.pageHeight()).toInt()
        val img = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
        val g = img.createGraphics()
        g.color = Color.WHITE
        g.fillRect(0, 0, w, h)
        // No font files: EVG measured this page with its own estimate, as the
        // browser build does, so the platform's sans is the honest choice on
        // both surfaces.
        val rec = RecordingSurface(AwtEvgSurface(g, emptyMap(), emptyMap()))
        EvgPainter.paint(list, rec)
        g.dispose()
        ImageIO.write(img, "png", File(dir, name))
        println("  ${dir.path}/$name  ${w}x$h, ${list.cmds.size} commands")
        return rec
    }
}
