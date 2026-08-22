package fi.ranger.pptx.evg

import fi.ranger.pptx.rgr.EVGDisplayList
import fi.ranger.pptx.rgr.EVGDrawCmd

/**
 * The walk: an `EVGDisplayList` in, calls on an [EvgSurface] out.
 *
 * The display list's own comment says a sixth backend should not be a sixth
 * copy of the traversal, and this is that rule applied one level down: Android
 * and AWT differ in how they fill a rounded box, not in what a command *means*,
 * so what a command means is decided exactly once, here.
 *
 * Two things this painter honours that the existing backends do not:
 *
 *  * **Gradients and shadows.** `EVGDisplayList.toJson` carries neither, so the
 *    WebGL host cannot draw them and only the CPU rasteriser does. Reading the
 *    objects directly — which is what a Kotlin host can do and a browser cannot
 *    — brings both back.
 *  * **Clipping and multi-ring paths.** The SoftCanvas painter ignores
 *    `PUSH_CLIP` / `POP_CLIP` and flattens every path to one polygon, so a
 *    ring-with-a-hole comes out solid. `save`/`clipRect`/`restore` and a real
 *    even-odd fill are one line each on both surfaces here.
 */
object EvgPainter {

    private const val RECT = 0
    private const val BORDER = 1
    private const val IMAGE = 2
    private const val TEXT = 3
    private const val PUSH_CLIP = 4
    private const val POP_CLIP = 5
    private const val PATH = 6
    private const val STROKE = 7

    /** Anything below this is invisible; drawing it is work for nothing. */
    private const val MIN_ALPHA = 0.001

    /**
     * Paint every command in order. Returns how many were actually drawn, which
     * is what a host puts in a debug overlay — a frame that draws 0 of 300
     * commands is a bug you want to see rather than a black screen.
     */
    fun paint(list: EVGDisplayList, surface: EvgSurface): Int {
        var drawn = 0
        // A list that pushes more clips than it pops must not leave the surface
        // with a clip nobody asked for, and one that pops more than it pushes
        // must not restore past the state the host handed us. The depth counter
        // is the whole of both guarantees.
        var clipDepth = 0
        val n = list.count()
        var i = 0
        while (i < n) {
            val c = list.at(i)
            i++
            when (c.kind) {
                PUSH_CLIP -> {
                    surface.save()
                    surface.clipRect(c.x.toFloat(), c.y.toFloat(), c.w.toFloat(), c.h.toFloat())
                    clipDepth++
                    continue
                }
                POP_CLIP -> {
                    if (clipDepth > 0) {
                        surface.restore()
                        clipDepth--
                    }
                    continue
                }
            }

            // A rotation turns the command about its own box centre, which is
            // what the PDF matrix and the GL shader both do. Wrapping it in
            // save/restore keeps the clip stack above untouched.
            val turned = c.rotate > 0.001 || c.rotate < -0.001
            if (turned) {
                surface.save()
                surface.rotate(
                    c.rotate.toFloat(),
                    (c.x + c.w * 0.5).toFloat(),
                    (c.y + c.h * 0.5).toFloat(),
                )
            }

            if (drawOne(c, surface)) drawn++

            if (turned) surface.restore()
        }
        while (clipDepth > 0) {
            surface.restore()
            clipDepth--
        }
        return drawn
    }

    private fun drawOne(c: EVGDrawCmd, surface: EvgSurface): Boolean {
        when (c.kind) {
            RECT -> {
                val shadow = shadowOf(c)
                val gradient = gradientOf(c)
                if (c.a < MIN_ALPHA && gradient == null && shadow == null) return false
                surface.fillRect(
                    c.x.toFloat(), c.y.toFloat(), c.w.toFloat(), c.h.toFloat(),
                    c.radius.toFloat(),
                    colorOf(c),
                    gradient,
                    shadow,
                )
                return true
            }
            BORDER -> {
                if (c.a < MIN_ALPHA) return false
                // A border with no thickness is still a border: the display
                // list leaves the default at 0 for a hairline, and a stroke of
                // width 0 is invisible on both surfaces.
                val t = if (c.thickness > 0.0) c.thickness.toFloat() else 1f
                surface.strokeRect(
                    c.x.toFloat(), c.y.toFloat(), c.w.toFloat(), c.h.toFloat(),
                    c.radius.toFloat(), t,
                    colorOf(c),
                )
                return true
            }
            IMAGE -> {
                if (c.src.isEmpty()) return false
                surface.drawImage(
                    c.src,
                    c.x.toFloat(), c.y.toFloat(), c.w.toFloat(), c.h.toFloat(),
                    c.radius.toFloat(),
                    c.flipH, c.flipV,
                )
                return true
            }
            TEXT -> {
                if (c.text.isEmpty()) return false
                if (c.a < MIN_ALPHA) return false
                surface.drawTextRun(
                    c.text,
                    c.x.toFloat(), c.y.toFloat(),
                    c.fontSize.toFloat(),
                    c.fontFamily,
                    isBold(c.fontWeight),
                    // `addText` has nowhere else to record a slanted face, so
                    // it writes "italic" into textAlign and `toJson` reads it
                    // back out the same way. Not lovely, but it is the format.
                    c.textAlign == "italic",
                    colorOf(c),
                )
                return true
            }
            PATH -> {
                if (c.a < MIN_ALPHA) return false
                if (c.pts.size < 6) return false
                surface.fillPath(c.pts, ringsOf(c), c.evenOdd, colorOf(c), shadowOf(c))
                return true
            }
            STROKE -> {
                if (c.a < MIN_ALPHA) return false
                if (c.pts.size < 4) return false
                val t = if (c.thickness > 0.0) c.thickness.toFloat() else 1f
                surface.strokePath(c.pts, ringsOf(c), t, colorOf(c))
                return true
            }
        }
        return false
    }

    /**
     * A path emitted by the SVG walk carries its ring boundaries; one emitted
     * by `addPolygon` / `addPolyline` may not. A single implicit ring covering
     * every point is the right reading of an empty `ringEnds` — it is what the
     * polygon filler assumes.
     */
    private fun ringsOf(c: EVGDrawCmd): List<Int> =
        if (c.ringEnds.isEmpty()) listOf(c.pts.size) else c.ringEnds

    private fun gradientOf(c: EVGDrawCmd): EvgGradient? {
        if (!c.hasGrad) return null
        return EvgGradient(
            color1 = argb(c.a, c.r, c.g, c.b),
            color2 = argb(c.a2, c.r2, c.g2, c.b2),
            // dir 0 = vertical (top to bottom), 1 = horizontal (left to right)
            vertical = c.gradDir != 1,
        )
    }

    private fun shadowOf(c: EVGDrawCmd): EvgShadow? {
        if (!c.hasShadow) return null
        if (c.shadowA < MIN_ALPHA) return null
        return EvgShadow(
            dx = c.shadowX.toFloat(),
            dy = c.shadowY.toFloat(),
            blur = c.shadowBlur.toFloat(),
            color = argb(c.shadowA, c.shadowR, c.shadowG, c.shadowB),
        )
    }

    private fun colorOf(c: EVGDrawCmd): Int = argb(c.a, c.r, c.g, c.b)

    /** 0-255 channels and a 0-1 alpha, the way every command carries them. */
    fun argb(alpha: Double, r: Int, g: Int, b: Int): Int {
        val a = clamp255((alpha * 255.0 + 0.5).toInt())
        return (a shl 24) or (clamp255(r) shl 16) or (clamp255(g) shl 8) or clamp255(b)
    }

    private fun clamp255(v: Int): Int = if (v < 0) 0 else if (v > 255) 255 else v

    /**
     * The display list writes the word, not the number — `addText` only ever
     * says "bold" — but a stylesheet path could put a CSS weight here, so a
     * number is read as one.
     */
    private fun isBold(weight: String): Boolean {
        if (weight.isEmpty()) return false
        if (weight == "bold" || weight == "bolder") return true
        val n = weight.toIntOrNull() ?: return false
        return n >= 600
    }
}
