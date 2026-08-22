package fi.ranger.pptx.desktop

import fi.ranger.pptx.evg.EvgGradient
import fi.ranger.pptx.evg.EvgShadow
import fi.ranger.pptx.evg.EvgSurface

/**
 * A surface that counts what it was asked to draw, and then draws it.
 *
 * "Every slide produced some ink" is a weak thing to check: a deck of nothing
 * but grey boxes passes it, and so does a painter that has quietly stopped
 * dispatching text. What a coverage run wants to know is which *kinds* of
 * command reached a surface at all — whether the corpus exercises paths and
 * clips and gradients and mirrored pictures, and whether the walk delivers
 * them — so this wraps the real surface and keeps a tally on the way through.
 */
class RecordingSurface(private val inner: EvgSurface) : EvgSurface {

    val calls = HashMap<String, Int>()

    private fun bump(what: String) {
        calls[what] = (calls[what] ?: 0) + 1
    }

    fun count(what: String): Int = calls[what] ?: 0

    override fun save() {
        bump("save"); inner.save()
    }

    override fun restore() {
        bump("restore"); inner.restore()
    }

    override fun clipRect(x: Float, y: Float, w: Float, h: Float) {
        bump("clipRect"); inner.clipRect(x, y, w, h)
    }

    override fun rotate(degrees: Float, px: Float, py: Float) {
        bump("rotate"); inner.rotate(degrees, px, py)
    }

    override fun fillRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, color: Int, gradient: EvgGradient?, shadow: EvgShadow?,
    ) {
        bump("fillRect")
        if (radius > 0.5f) bump("roundedRect")
        if (gradient != null) bump("gradient")
        if (shadow != null) bump("shadow")
        inner.fillRect(x, y, w, h, radius, color, gradient, shadow)
    }

    override fun strokeRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, thickness: Float, color: Int,
    ) {
        bump("strokeRect"); inner.strokeRect(x, y, w, h, radius, thickness, color)
    }

    override fun fillPath(
        pts: List<Double>, ringEnds: List<Int>, evenOdd: Boolean,
        color: Int, shadow: EvgShadow?,
    ) {
        bump("fillPath")
        if (ringEnds.size > 1) bump("multiRingPath")
        if (evenOdd) bump("evenOddPath")
        if (shadow != null) bump("shadow")
        inner.fillPath(pts, ringEnds, evenOdd, color, shadow)
    }

    override fun strokePath(pts: List<Double>, ringEnds: List<Int>, thickness: Float, color: Int) {
        bump("strokePath"); inner.strokePath(pts, ringEnds, thickness, color)
    }

    override fun drawImage(
        src: String, x: Float, y: Float, w: Float, h: Float,
        radius: Float, flipH: Boolean, flipV: Boolean,
    ) {
        bump("drawImage")
        if (flipH || flipV) bump("mirroredImage")
        inner.drawImage(src, x, y, w, h, radius, flipH, flipV)
    }

    override fun drawTextRun(
        text: String, x: Float, top: Float, sizePx: Float,
        family: String, bold: Boolean, italic: Boolean, color: Int,
    ) {
        bump("drawTextRun")
        if (bold) bump("boldText")
        if (italic) bump("italicText")
        // A run outside the Latin block is what tells you the TrueType reader
        // and the face pool are doing something rather than getting lucky.
        if (text.any { it.code > 127 }) bump("nonAsciiText")
        inner.drawTextRun(text, x, top, sizePx, family, bold, italic, color)
    }
}
