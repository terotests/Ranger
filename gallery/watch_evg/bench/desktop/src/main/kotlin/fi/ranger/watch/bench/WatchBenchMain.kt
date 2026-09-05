package fi.ranger.watch.bench

import fi.ranger.evg.AwtEvgSurface
import fi.ranger.evg.AwtFaces
import fi.ranger.evg.AwtTextMeasurer
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.RecordingSurface
import fi.ranger.rgr.EVGElement
import fi.ranger.rgr.EVGLayout
import fi.ranger.rgr.EVGStyleSheet
import fi.ranger.rgr.WatchBench
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

/**
 * EVG's frame, on the language a Wear OS app is written in.
 *
 * The claim this exists to test is "EVG is too heavy for a watch". That is a
 * claim about a budget, so the answer has to be milliseconds against a budget,
 * and the milliseconds have to come from the code a watch would actually run —
 * not from Node. `WatchBench.rgr` is compiled to **Kotlin** here, the same
 * compiler invocation `gallery/ui/android` and `gallery/pptx/android` use for
 * their APKs, and every phase below is that generated Kotlin.
 *
 * What this is not: a device. There is no Android SDK in this repository's CI
 * and an emulator needs KVM, so what runs here is a JVM and Java2D rather than
 * ART and `android.graphics`. Two consequences, both stated rather than
 * papered over:
 *
 *  * **The JIT is not ART.** HotSpot's C2 is a better compiler than ART's, so
 *    `--c1` runs the whole benchmark again with C2 switched off
 *    (`-XX:TieredStopAtLevel=1`). ART's steady state sits between the two, and
 *    quoting both is more honest than quoting either.
 *  * **Java2D is not Skia, and neither is a GPU.** The paint number here is a
 *    software rasteriser on a CPU. On a watch, `android.graphics.Canvas` is
 *    hardware-accelerated. So `paint` is an upper bound on that stage and the
 *    interesting numbers are the four CPU phases before it, which are the
 *    same instructions on either platform.
 *
 * `calibrate` closes the last gap. It is a fixed scalar loop in the same
 * generated Kotlin; run this class on a real watch and the ratio of the two
 * calibration times scales every other row. Nothing here has to be believed on
 * the strength of a clock speed.
 *
 *   java -cp … fi.ranger.watch.bench.WatchBenchMain <repo-root> [--png] [--json]
 */
object WatchBenchMain {

    private const val WARM = 300
    private const val RUNS = 51

    /** Median of [RUNS] after [WARM] discarded — one GC pause ruins a mean. */
    private fun time(warm: Int = WARM, runs: Int = RUNS, fn: () -> Unit): Double {
        for (i in 0 until warm) fn()
        val t = DoubleArray(runs)
        for (i in 0 until runs) {
            val a = System.nanoTime()
            fn()
            t[i] = (System.nanoTime() - a) / 1e6
        }
        t.sort()
        return t[runs / 2]
    }

    private class Scene(val name: String, val kind: Int, val n: Int, val v: Int)

    private val SCENES = listOf(
        Scene("face", 0, 60, 7),
        Scene("list", 1, 12, 2),
        Scene("workout", 2, 0, 148),
    )

    private class Row(
        val name: String,
        val elements: Int,
        val commands: Int,
        val build: Double,
        val style: Double,
        val layout: Double,
        val list: Double,
        val paint: Double,
        val tick: Double,
        val scroll: Double,
        val retained: Double,
        val rebuild: Double,
        val cold: Double,
        val tickStyled: Int,
        val tickSkipped: Int,
        val tickLayoutClean: Boolean,
        val heapKb: Long,
    )

    private fun sheet(css: String): EVGStyleSheet = WatchBench.sheetFor(css)

    /** Bytes the tree and its display list hold on to, after a settled heap. */
    /** The JDK's sans, measured and painted: one face for both. */
    private val faces = AwtFaces(emptyMap())

    private fun retainedKb(css: String, s: Scene): Long {
        val rt = Runtime.getRuntime()
        fun settle(): Long {
            for (i in 0 until 6) { System.gc(); Thread.sleep(30) }
            return rt.totalMemory() - rt.freeMemory()
        }
        val before = settle()
        val sh = sheet(css)
        val root = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(sh, root)
        val lay = WatchBench.layoutOnly(root)
        val dl = WatchBench.listOf(root, lay)
        val after = settle()
        // Touch everything so nothing above is collectable at the measurement.
        val keep = dl.count() + WatchBench.countElements(root) + lay.hashCode()
        if (keep == Int.MIN_VALUE) println("unreachable")
        return (after - before) / 1024
    }

    private fun measure(css: String, s: Scene, png: File?, cold: Double): Row {
        val build = time { WatchBench.scene(s.kind, s.n, s.v) }

        val s1 = sheet(css)
        val styleTree = WatchBench.scene(s.kind, s.n, s.v)
        val style = time { WatchBench.styleOnly(s1, styleTree) }

        val s2 = sheet(css)
        val layTree = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(s2, layTree)
        val layout = time { WatchBench.layoutOnly(layTree) }

        val s3 = sheet(css)
        val dlTree = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(s3, dlTree)
        val dlLay = WatchBench.layoutOnly(dlTree)
        val list = time { WatchBench.listOnly(dlTree, dlLay) }

        // --- rebuild: a declarative frame from nothing --------------------------
        // The stylesheet is parsed ONCE, outside the loop, because that is what
        // an app does: `parse` is startup and is reported on its own. Charging
        // every frame for it would say more about the CSS parser than about the
        // frame, and on a tree this small it would say only that.
        val sR = sheet(css)
        val rebuild = time {
            val root = WatchBench.scene(s.kind, s.n, s.v)
            WatchBench.styleOnly(sR, root)
            val lay = WatchBench.layoutOnly(root)
            WatchBench.listOnly(root, lay)
        }

        // --- retained: the tree stands, everything after it runs again ----------
        val s4 = sheet(css)
        val live = WatchBench.scene(s.kind, s.n, s.v)
        val retained = time {
            WatchBench.styleOnly(s4, live)
            val lay = WatchBench.layoutOnly(live)
            WatchBench.listOnly(live, lay)
        }

        // --- tick: the clock's seconds change -----------------------------------
        // The one-per-second workload of an always-on face. One text run is
        // different; the tree, the classes and every box are not. If this costs
        // what `retained` costs, nothing is being avoided — and on a watch that
        // is the difference between a battery that lasts a day and one that
        // does not.
        val s5 = sheet(css)
        val tickTree = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(s5, tickTree)
        var tickLay = WatchBench.layoutOnly(tickTree)
        WatchBench.listOnly(tickTree, tickLay)
        var sec = 0
        val tick = time {
            sec = (sec + 1) % 60
            WatchBench.setClock(tickTree, sec)
            WatchBench.styleOnly(s5, tickTree)
            if (!WatchBench.layoutClean(s5)) tickLay = WatchBench.layoutOnly(tickTree)
            WatchBench.listOnly(tickTree, tickLay)
        }
        val tickStyled = WatchBench.styledCount(s5)
        val tickSkipped = WatchBench.skippedCount(s5)
        val tickClean = WatchBench.layoutClean(s5)

        // --- scroll: the crown turned -------------------------------------------
        // Layout has to run — the offset is a layout input — but the tree did
        // not change and neither did any class. This is the 60fps path.
        val s6 = sheet(css)
        val scrollTree = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(s6, scrollTree)
        var off = 0.0
        val scroll = time {
            off += 3.0
            if (off > 240.0) off = 0.0
            WatchBench.setScroll(scrollTree, off)
            val lay = WatchBench.layoutOnly(scrollTree)
            WatchBench.listOnly(scrollTree, lay)
        }

        // --- paint: the display list through the shared Android painter ----------
        val sP = sheet(css)
        val paintTree = WatchBench.scene(s.kind, s.n, s.v)
        WatchBench.styleOnly(sP, paintTree)
        val paintLay = WatchBench.layoutOnly(paintTree)
        val dl = WatchBench.listOf(paintTree, paintLay)
        val w = 454
        val h = 454
        val img = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
        val paint = time(warm = 60, runs = 41) {
            val g = img.createGraphics()
            g.color = Color.BLACK
            g.fillRect(0, 0, w, h)
            EvgPainter.paint(dl, AwtEvgSurface(g, emptyMap(), faces))
            g.dispose()
        }

        var commands = dl.count()
        if (png != null) {
            val g = img.createGraphics()
            g.color = Color.BLACK
            g.fillRect(0, 0, w, h)
            val rec = RecordingSurface(AwtEvgSurface(g, emptyMap(), faces))
            val drawn = EvgPainter.paint(dl, rec)
            g.dispose()
            ImageIO.write(img, "png", File(png, "watch_${s.name}.png"))
            println("  ${png.path}/watch_${s.name}.png  ${w}x$h, $commands commands, $drawn drawn, surface calls ${rec.calls}")
            commands = dl.count()
        }

        return Row(
            s.name, WatchBench.countElements(dlTree), commands,
            build, style, layout, list, paint, tick, scroll, retained, rebuild, cold,
            tickStyled, tickSkipped, tickClean, retainedKb(css, s),
        )
    }

    private fun f(v: Double) = String.format("%7.3f", v)

    @JvmStatic
    fun main(args: Array<String>) {
        val root = File(args.firstOrNull { !it.startsWith("--") } ?: ".")
        val wantPng = args.contains("--png")
        val asJson = args.contains("--json")
        val css = File(root, "gallery/watch_evg/bench/watch.css")
        if (!css.isFile) {
            System.err.println("watch.css not found at ${css.path} — pass the repository root")
            kotlin.system.exitProcess(3)
        }
        val cssText = css.readText()
        val out = if (wantPng) File(root, "tmp/watch-bench").apply { mkdirs() } else null
        // Java2D measures the text every scene below is laid out with — the
        // same faces the surfaces paint with — so the layout column is the
        // cost of measuring a real face, which is what a Wear OS host pays
        // through `AndroidTextMeasurer`, and not the cost of the table.
        AwtTextMeasurer.install(faces)

        // --- the cold frame, before anything at all is warm ---------------------
        // This has to be first and it has to be once. A watch app is launched,
        // draws, and is killed; the frame a person waits for is an interpreted
        // one on classes that are still being loaded, not the steady state
        // below. Measured per scene in a fresh process would be cleaner still,
        // but the first of the three is already the honest number and the two
        // after it show how fast the JIT takes hold.
        val cold = HashMap<String, Double>()
        for (s in SCENES) {
            val a = System.nanoTime()
            val sh = WatchBench.sheetFor(cssText)
            val root = WatchBench.scene(s.kind, s.n, s.v)
            WatchBench.styleOnly(sh, root)
            val lay = WatchBench.layoutOnly(root)
            WatchBench.listOnly(root, lay)
            cold[s.name] = (System.nanoTime() - a) / 1e6
        }

        // Parsing the stylesheet is startup, not a frame, so it is its own row.
        val cssParse = time(warm = 20, runs = 21) { WatchBench.sheetFor(cssText) }

        // The calibration, so the numbers can leave this machine.
        val calWarm = WatchBench.calibrate(2_000_000)
        if (calWarm == Double.NaN) println("unreachable")
        val cal = time(warm = 3, runs = 9) { WatchBench.calibrate(2_000_000) }

        // Twice, reporting the second. The phases are tens of microseconds and
        // they are measured in a fixed order, so a phase timed early sees a
        // less-optimised method than the same phase timed late; running the
        // whole set once and throwing it away removes that ordering from the
        // answer.
        SCENES.map { measure(cssText, it, null, 0.0) }
        val rows = SCENES.map { measure(cssText, it, out, cold[it.name] ?: 0.0) }

        if (asJson) {
            val sb = StringBuilder("{\n")
            sb.append("  \"jvm\": \"${System.getProperty("java.vm.name")} ${System.getProperty("java.version")}\",\n")
            sb.append("  \"os\": \"${System.getProperty("os.name")} ${System.getProperty("os.arch")}\",\n")
            sb.append("  \"calibrateMs\": ${"%.3f".format(cal)},\n")
            sb.append("  \"cssParseMs\": ${"%.3f".format(cssParse)},\n")
            sb.append("  \"scenes\": [\n")
            rows.forEachIndexed { i, r ->
                sb.append("    {\"name\":\"${r.name}\",\"elements\":${r.elements},\"commands\":${r.commands},")
                sb.append("\"build\":${"%.4f".format(r.build)},\"style\":${"%.4f".format(r.style)},")
                sb.append("\"layout\":${"%.4f".format(r.layout)},\"displayList\":${"%.4f".format(r.list)},")
                sb.append("\"paint\":${"%.4f".format(r.paint)},\"tick\":${"%.4f".format(r.tick)},")
                sb.append("\"scroll\":${"%.4f".format(r.scroll)},\"retained\":${"%.4f".format(r.retained)},")
                sb.append("\"rebuild\":${"%.4f".format(r.rebuild)},\"cold\":${"%.4f".format(r.cold)},")
                sb.append("\"tickStyled\":${r.tickStyled},")
                sb.append("\"tickSkipped\":${r.tickSkipped},\"tickLayoutClean\":${r.tickLayoutClean},")
                sb.append("\"heapKb\":${r.heapKb}}")
                sb.append(if (i == rows.lastIndex) "\n" else ",\n")
            }
            sb.append("  ]\n}")
            println(sb)
            return
        }

        println()
        println("=== EVG on a 454x454 watch panel — ms per frame, Kotlin on ${System.getProperty("java.vm.name")} ===")
        println("    (median of $RUNS after $WARM warm-up runs; calibrate(2e6) = ${"%.1f".format(cal)} ms," +
                " stylesheet parse ${"%.2f".format(cssParse)} ms)")
        println()
        println("  scene    elems  cmds |   build   style  layout    list |   paint    tick  scroll retained rebuild |    cold  heap")
        println("  -------  -----  ---- | ------- ------- ------- ------- | ------- ------- ------- -------- ------- | ------- -----")
        for (r in rows) {
            println(
                "  ${r.name.padEnd(7)}  ${r.elements.toString().padStart(5)}  ${r.commands.toString().padStart(4)} |" +
                    " ${f(r.build)} ${f(r.style)} ${f(r.layout)} ${f(r.list)} |" +
                    " ${f(r.paint)} ${f(r.tick)} ${f(r.scroll)} ${f(r.retained)} ${f(r.rebuild)} |" +
                    " ${f(r.cold)} ${r.heapKb}K",
            )
        }
        println()
        for (r in rows) {
            println(
                "  tick on ${r.name}: ${r.tickStyled} element(s) re-styled, ${r.tickSkipped} skipped," +
                    " layout ${if (r.tickLayoutClean) "SKIPPED" else "run"}",
            )
        }
        println()
        println("  Budgets a watch has: 16.7ms for 60fps while the crown turns, and one")
        println("  `tick` a second, forever, on an always-on face. `scroll` against the")
        println("  first and `tick` against the second is the whole question.")
    }
}
