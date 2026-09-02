package fi.ranger.watch.desktop

import fi.ranger.evg.AwtEvgSurface
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.RecordingSurface
import fi.ranger.rgr.EVGDisplayList
import fi.ranger.rgr.WatchEvgAndroid
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO
import kotlin.math.roundToInt

/**
 * Watch-sized EVG through the Android port's painter, without a device.
 *
 * Same seam the phone apps use: generated Ranger → [EVGDisplayList] →
 * [EvgPainter]. Only the surface is Java2D ([AwtEvgSurface]) instead of
 * `android.graphics.Canvas`, which is the repository's established off-device
 * measurement path (`ui:android:verify`, `pptx:android:verify`).
 *
 * Prints JSON lines a doc / script can collect, plus PNGs under tmp/watch-evg.
 *
 *     kotlin -cp … fi.ranger.watch.desktop.BenchWatchKt <ranger-root>
 */
fun main(args: Array<String>) {
    val root = File(args.getOrElse(0) { "." })
    val out = File(root, "tmp/watch-evg").apply { mkdirs() }
    val app = WatchEvgAndroid()
    val size = app.faceSize().roundToInt().coerceAtLeast(1)

    println("=== Watch EVG Android painter bench @ ${size}×${size} ===")
    println("host=jvm-awt painter=EvgPainter surface=AwtEvgSurface")
    println("note=Canvas on device is typically similar-or-faster than AWT Soft for simple vectors")

    val cases = listOf(
        Case("bezel", 4) { app.bezelFrame(4) },
        Case("bezel", 8) { app.bezelFrame(8) },
        Case("bezel", 12) { app.bezelFrame(12) },
        Case("list", 4) { app.listFrame(4) },
        Case("list", 8) { app.listFrame(8) },
        Case("list", 12) { app.listFrame(12) },
    )

    // Warm the JIT on the first case so later medians are not dominated by
    // class loading of the generated Ranger file.
    repeat(4) { cases[0].build() }

    val rows = mutableListOf<Result>()
    for (c in cases) {
        rows += measure(app, c, size, out)
    }

    println()
    println("  scene   n  els  cmds |  build_ms  paint_ms  total_ms | drawn")
    println("  -----  --  ---  ---- | --------- --------- --------- | -----")
    for (r in rows) {
        println(
            "  %-5s  %2d  %3d  %4d | %9.2f %9.2f %9.2f | %5d".format(
                r.scene, r.n, r.elements, r.cmds,
                r.buildMs, r.paintMs, r.buildMs + r.paintMs, r.drawn,
            ),
        )
    }

    println()
    println("WATCH_PERF_JSON " + rows.joinToString(prefix = "[", postfix = "]") {
        """{"scene":"${it.scene}","n":${it.n},"elements":${it.elements},"cmds":${it.cmds},"build_ms":${"%.3f".format(it.buildMs)},"paint_ms":${"%.3f".format(it.paintMs)},"drawn":${it.drawn},"png":"${it.png}"}"""
    })

    // Sanity: every case must actually ink the face.
    val empty = rows.count { it.drawn < 3 }
    if (empty > 0) {
        System.err.println("$empty case(s) painted almost nothing")
        kotlin.system.exitProcess(1)
    }
}

private data class Case(val scene: String, val n: Int, val build: () -> EVGDisplayList)

private data class Result(
    val scene: String,
    val n: Int,
    val elements: Int,
    val cmds: Int,
    val buildMs: Double,
    val paintMs: Double,
    val drawn: Int,
    val png: String,
)

private fun measure(app: WatchEvgAndroid, c: Case, size: Int, out: File): Result {
    // Warm this specific shape a couple of times.
    repeat(2) { c.build() }

    val builds = DoubleArray(9)
    var list: EVGDisplayList = c.build()
    for (i in builds.indices) {
        val t0 = System.nanoTime()
        list = c.build()
        builds[i] = (System.nanoTime() - t0) / 1e6
    }
    builds.sort()
    val buildMs = builds[builds.size / 2]

    val paints = DoubleArray(9)
    var drawn = 0
    var img: BufferedImage? = null
    for (i in paints.indices) {
        val frame = BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB)
        val g = frame.createGraphics()
        g.color = Color(11, 15, 20)
        g.fillRect(0, 0, size, size)
        val surface = AwtEvgSurface(g, emptyMap(), emptyMap())
        val t0 = System.nanoTime()
        drawn = EvgPainter.paint(list, surface)
        paints[i] = (System.nanoTime() - t0) / 1e6
        g.dispose()
        img = frame
    }
    paints.sort()
    val paintMs = paints[paints.size / 2]

    val name = "%s-%02d.png".format(c.scene, c.n)
    val png = File(out, name)
    ImageIO.write(img!!, "png", png)

    // Coverage check once: RecordingSurface counts what the painter dispatched.
    val cov = BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB)
    val cg = cov.createGraphics()
    val rec = RecordingSurface(AwtEvgSurface(cg, emptyMap(), emptyMap()))
    EvgPainter.paint(list, rec)
    cg.dispose()

    println(
        "  measured %s n=%d els=%d cmds=%d build=%.2fms paint=%.2fms drawn=%d calls=%s -> %s".format(
            c.scene, c.n, app.elementCount(), list.count(),
            buildMs, paintMs, drawn, rec.calls.toString(), png.path,
        ),
    )

    return Result(
        scene = c.scene,
        n = c.n,
        elements = app.elementCount(),
        cmds = list.count(),
        buildMs = buildMs,
        paintMs = paintMs,
        drawn = drawn,
        png = png.path,
    )
}
