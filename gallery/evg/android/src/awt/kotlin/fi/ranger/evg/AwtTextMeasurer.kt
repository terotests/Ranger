// SPDX-License-Identifier: AGPL-3.0-or-later
package fi.ranger.evg

import fi.ranger.rgr.EVGDefaultMeasurer
import fi.ranger.rgr.EVGHostTextMeasurer
import java.awt.Font
import java.awt.font.FontRenderContext
import java.io.File

/**
 * The faces a Java2D host draws with, resolved ONE way.
 *
 * [AwtEvgSurface] used to resolve a family to a `Font` privately, per
 * surface — and a surface is made per `Graphics2D`, so per frame. With a
 * measurer that has to resolve the same family to the same face without a
 * `Graphics2D` in hand, the resolution moves here and both ask it: a family
 * named in [fontFiles] is that file, anything else is the first file or the
 * JDK's sans, and bold and italic are derived styles of it. Whatever the
 * rule is, there is one of it.
 */
class AwtFaces(fontFiles: Map<String, File>) {

    private data class FontKey(val family: String, val size: Int, val bold: Boolean, val italic: Boolean)

    private val fontCache = HashMap<FontKey, Font>()
    private val baseFonts = HashMap<String, Font>()
    private var fallback: Font = Font(Font.SANS_SERIF, Font.PLAIN, 12)

    init {
        for ((family, file) in fontFiles) {
            val f = runCatching { Font.createFont(Font.TRUETYPE_FONT, file) }.getOrNull() ?: continue
            baseFonts[family.lowercase()] = f
            if (baseFonts.size == 1) fallback = f
        }
    }

    fun font(family: String, sizePx: Float, bold: Boolean, italic: Boolean): Font {
        val key = FontKey(family.lowercase(), Math.round(sizePx * 4), bold, italic)
        synchronized(fontCache) {
            return fontCache.getOrPut(key) {
                val base = baseFonts[family.lowercase()] ?: fallback
                var style = Font.PLAIN
                if (bold) style = style or Font.BOLD
                if (italic) style = style or Font.ITALIC
                base.deriveFont(style, sizePx)
            }
        }
    }
}

/**
 * Java2D measures, EVG breaks the lines — the desktop twin of
 * [AndroidTextMeasurer], for the same reason [AwtEvgSurface] is the twin of
 * [AndroidEvgSurface]: so the port can be CHECKED where there is no device.
 * A check that lays out with the table and paints with Java2D is asserting
 * about two faces; with this installed it asserts about one.
 *
 * Widths come from `Font.getStringBounds` with a fractional-metrics render
 * context, which is the advance Java2D lays the string out to when the
 * surface's anti-aliasing hints are on; the vertical numbers from
 * `getLineMetrics`, which is the face's, not the string's.
 */
object AwtTextMeasurer {

    /**
     * Make the measurer, attach Java2D to it through [faces] and make it the
     * default every `EVGLayout` and `EVGTextEngine` in the process starts
     * from. Hand the SAME [AwtFaces] to every [AwtEvgSurface] the check makes.
     */
    fun install(faces: AwtFaces): EVGHostTextMeasurer {
        val frc = FontRenderContext(null, true, true)
        val measurer = EVGHostTextMeasurer()
        measurer.attach({ kind, text, family, size, bold, italic ->
            val font = faces.font(family, size.toFloat(), bold, italic)
            when (kind) {
                0 -> if (text.isEmpty()) 0.0 else font.getStringBounds(text, frc).width
                1 -> font.getLineMetrics("Hg", frc).ascent.toDouble()
                2 -> font.getLineMetrics("Hg", frc).descent.toDouble()
                else -> font.getLineMetrics("Hg", frc).leading.toDouble()
            }
        }, "awt")
        EVGDefaultMeasurer.install(measurer)
        return measurer
    }
}
