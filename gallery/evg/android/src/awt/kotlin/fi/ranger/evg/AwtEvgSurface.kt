package fi.ranger.evg

import java.awt.AlphaComposite
import java.awt.BasicStroke
import java.awt.Color
import java.awt.Font
import java.awt.GradientPaint
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.Shape
import java.awt.geom.AffineTransform
import java.awt.geom.Path2D
import java.awt.geom.RoundRectangle2D
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.File
import javax.imageio.ImageIO

/**
 * The same display list, painted with Java2D.
 *
 * This exists so the port can be *checked*. An `android.graphics.Canvas`
 * painter can only be run on a device or an emulator, and neither is available
 * where this repository's tests run; Java2D is in every JDK. Both surfaces
 * implement the same interface and are driven by the same [EvgPainter], so a
 * page that renders correctly here is evidence about the walk, the geometry,
 * the colours, the clip stack and the text placement — everything except the
 * last page of platform delegation.
 *
 * It is also a usable desktop host in its own right: `RenderDeck` turns a
 * `.pptx` into PNGs with it, and `CheckDashboard` does the same for the ui
 * gallery's dashboard.
 */
class AwtEvgSurface(
    private val g: Graphics2D,
    /** The deck's own picture parts, by package path. */
    private val images: Map<String, ByteArray>,
    /** TrueType files to draw with, by the family name EVG measured under. */
    fontFiles: Map<String, File>,
) : EvgSurface {

    private val stack = ArrayDeque<State>()
    private val imageCache = HashMap<String, BufferedImage?>()
    private val fontCache = HashMap<FontKey, Font>()
    private val baseFonts = HashMap<String, Font>()
    private var fallback: Font = Font(Font.SANS_SERIF, Font.PLAIN, 12)

    private data class State(val clip: Shape?, val transform: AffineTransform)
    private data class FontKey(val family: String, val size: Int, val bold: Boolean, val italic: Boolean)

    init {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
        g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE)
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
        for ((family, file) in fontFiles) {
            val f = runCatching { Font.createFont(Font.TRUETYPE_FONT, file) }.getOrNull() ?: continue
            baseFonts[family.lowercase()] = f
            if (baseFonts.size == 1) fallback = f
        }
    }

    override fun save() {
        stack.addLast(State(g.clip, AffineTransform(g.transform)))
    }

    override fun restore() {
        val s = stack.removeLastOrNull() ?: return
        g.transform = s.transform
        g.clip = s.clip
    }

    override fun clipRect(x: Float, y: Float, w: Float, h: Float) {
        g.clipRect(x.toInt(), y.toInt(), Math.ceil(w.toDouble()).toInt(), Math.ceil(h.toDouble()).toInt())
    }

    override fun rotate(degrees: Float, px: Float, py: Float) {
        g.rotate(Math.toRadians(degrees.toDouble()), px.toDouble(), py.toDouble())
    }

    override fun fillRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, color: Int, gradient: EvgGradient?, shadow: EvgShadow?,
    ) {
        if (w <= 0f || h <= 0f) return
        val shape = roundRect(x, y, w, h, radius)
        shadow?.let { paintShadow(shape, it) }
        if (gradient != null) {
            g.paint = if (gradient.vertical) {
                GradientPaint(x, y, awt(gradient.color1), x, y + h, awt(gradient.color2))
            } else {
                GradientPaint(x, y, awt(gradient.color1), x + w, y, awt(gradient.color2))
            }
        } else {
            if (alphaOf(color) == 0) return
            g.paint = awt(color)
        }
        g.fill(shape)
    }

    override fun strokeRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, thickness: Float, color: Int,
    ) {
        if (w <= 0f || h <= 0f) return
        // EVG's border is a band of `thickness` kept INSIDE the box, so the
        // stroke is centred half a thickness in from the edge.
        val half = thickness / 2f
        val shape = roundRect(x + half, y + half, w - thickness, h - thickness, (radius - half).coerceAtLeast(0f))
        g.paint = awt(color)
        g.stroke = BasicStroke(thickness, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER)
        g.draw(shape)
    }

    override fun fillPath(
        pts: List<Double>, ringEnds: List<Int>, evenOdd: Boolean,
        color: Int, shadow: EvgShadow?,
    ) {
        val path = buildPath(pts, ringEnds, evenOdd, close = true) ?: return
        shadow?.let { paintShadow(path, it) }
        g.paint = awt(color)
        g.fill(path)
    }

    override fun strokePath(pts: List<Double>, ringEnds: List<Int>, thickness: Float, color: Int) {
        val path = buildPath(pts, ringEnds, evenOdd = false, close = false) ?: return
        g.paint = awt(color)
        g.stroke = BasicStroke(thickness, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND)
        g.draw(path)
    }

    override fun drawImage(
        src: String, x: Float, y: Float, w: Float, h: Float,
        radius: Float, flipH: Boolean, flipV: Boolean,
    ) {
        if (w <= 0f || h <= 0f) return
        val img = imageCache.getOrPut(src) {
            images[src]?.let { bytes -> runCatching { ImageIO.read(ByteArrayInputStream(bytes)) }.getOrNull() }
        }
        if (img == null) {
            // A missing texture and an empty slide must not look the same.
            g.paint = Color(180, 198, 230)
            g.fill(roundRect(x, y, w, h, radius))
            return
        }
        val old = g.clip
        if (radius > 0.5f) g.clip(roundRect(x, y, w, h, radius))
        val sx = if (flipH) -1.0 else 1.0
        val sy = if (flipV) -1.0 else 1.0
        val at = AffineTransform()
        at.translate((x + if (flipH) w else 0f).toDouble(), (y + if (flipV) h else 0f).toDouble())
        at.scale(sx * w / img.width, sy * h / img.height)
        g.drawImage(img, at, null)
        g.clip = old
    }

    override fun drawTextRun(
        text: String, x: Float, top: Float, sizePx: Float,
        family: String, bold: Boolean, italic: Boolean, color: Int,
    ) {
        if (sizePx <= 0f) return
        val font = fontFor(family, sizePx, bold, italic)
        g.font = font
        g.paint = awt(color)
        // `top` is the top of the line box; the baseline is one face-ascent
        // below it. This is the same rule the WebGL atlas and the software
        // rasteriser place a run by.
        val baseline = top + g.fontMetrics.ascent
        g.drawString(text, x, baseline)
    }

    // --- the parts that are only arithmetic ----------------------------------

    private fun roundRect(x: Float, y: Float, w: Float, h: Float, radius: Float): Shape {
        if (radius <= 0.5f) {
            return java.awt.geom.Rectangle2D.Float(x, y, w, h)
        }
        val r = radius.coerceAtMost(minOf(w, h) / 2f) * 2f
        return RoundRectangle2D.Float(x, y, w, h, r, r)
    }

    private fun buildPath(pts: List<Double>, ringEnds: List<Int>, evenOdd: Boolean, close: Boolean): Path2D.Float? {
        if (pts.size < 4) return null
        val path = Path2D.Float(if (evenOdd) Path2D.WIND_EVEN_ODD else Path2D.WIND_NON_ZERO)
        var start = 0
        for (end in ringEnds) {
            val stop = end.coerceAtMost(pts.size)
            if (stop - start < 4) { start = stop; continue }
            path.moveTo(pts[start], pts[start + 1])
            var i = start + 2
            while (i + 1 < stop) {
                path.lineTo(pts[i], pts[i + 1])
                i += 2
            }
            if (close) path.closePath()
            start = stop
        }
        return if (path.currentPoint == null) null else path
    }

    /**
     * Java2D has no blur, so the soft edge is faked the way a shadow was faked
     * before anyone had one: the silhouette drawn a few times, growing and
     * fading. Cheap, and close enough to tell a shadowed shape from a flat one
     * — which is all this surface is asked to prove.
     */
    private fun paintShadow(shape: Shape, shadow: EvgShadow) {
        val steps = if (shadow.blur > 0.5f) 4 else 1
        val old = g.composite
        val at = AffineTransform.getTranslateInstance(shadow.dx.toDouble(), shadow.dy.toDouble())
        val moved = at.createTransformedShape(shape)
        val base = alphaOf(shadow.color) / 255f
        for (s in 0 until steps) {
            val grow = shadow.blur * s / steps
            val a = base * (1f - s.toFloat() / steps) / steps * 2f
            g.composite = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a.coerceIn(0f, 1f))
            g.paint = Color(shadow.color and 0xFFFFFF, false)
            if (grow <= 0f) {
                g.fill(moved)
            } else {
                g.stroke = BasicStroke(grow * 2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND)
                g.fill(moved)
                g.draw(moved)
            }
        }
        g.composite = old
    }

    private fun fontFor(family: String, sizePx: Float, bold: Boolean, italic: Boolean): Font {
        val key = FontKey(family.lowercase(), Math.round(sizePx * 4), bold, italic)
        return fontCache.getOrPut(key) {
            val base = baseFonts[family.lowercase()] ?: fallback
            var style = Font.PLAIN
            if (bold) style = style or Font.BOLD
            if (italic) style = style or Font.ITALIC
            base.deriveFont(style, sizePx)
        }
    }

    private fun awt(argb: Int): Color = Color(argb, true)

    private fun alphaOf(argb: Int): Int = (argb ushr 24) and 0xFF
}
