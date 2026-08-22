package fi.ranger.pptx

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import fi.ranger.pptx.evg.EvgGradient
import fi.ranger.pptx.evg.EvgShadow
import fi.ranger.pptx.evg.EvgSurface

/**
 * The display list, painted with `android.graphics.Canvas`.
 *
 * This is the whole of the platform-specific half of the port: every command
 * kind maps onto something Skia already does — a rounded rect, a shader, a
 * path with a fill type, a run of text at a baseline — so there is no
 * rasteriser here, no atlas, no shader, and nothing that has to agree with the
 * layout engine about anything but coordinates.
 *
 * Text is drawn rather than blitted. EVG measured each run with its own
 * TrueType reader against the same `.ttf` the [FaceSet] loads, and the command
 * carries the run's origin, so Skia only has to put the same glyphs at the same
 * place at whatever size the canvas is currently scaled to. That is why a
 * pinch-zoom stays sharp: nothing was ever rasterised at a fixed size.
 */
class AndroidEvgSurface(
    private val canvas: Canvas,
    /** Decoded pictures by package part, from [ImageStore]. */
    private val images: ImageStore,
    private val faces: FaceSet,
) : EvgSurface {

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG)
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val text = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val rect = RectF()
    private val path = Path()

    /**
     * A blur mask filter is ignored on a hardware-accelerated canvas, so a
     * shadow there would be a hard-edged silhouette — worse than none. The
     * canvas knows which it is; `SlideView` asks for a software layer precisely
     * so this comes out true.
     */
    private val canBlur = !canvas.isHardwareAccelerated

    override fun save() {
        canvas.save()
    }

    override fun restore() {
        canvas.restore()
    }

    override fun clipRect(x: Float, y: Float, w: Float, h: Float) {
        canvas.clipRect(x, y, x + w, y + h)
    }

    override fun rotate(degrees: Float, px: Float, py: Float) {
        canvas.rotate(degrees, px, py)
    }

    override fun fillRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, color: Int, gradient: EvgGradient?, shadow: EvgShadow?,
    ) {
        if (w <= 0f || h <= 0f) return
        rect.set(x, y, x + w, y + h)
        val r = radius.coerceAtMost(minOf(w, h) / 2f)
        shadow?.let { drawShadowRect(rect, r, it) }
        fill.shader = gradient?.let {
            if (it.vertical) {
                LinearGradient(x, y, x, y + h, it.color1, it.color2, Shader.TileMode.CLAMP)
            } else {
                LinearGradient(x, y, x + w, y, it.color1, it.color2, Shader.TileMode.CLAMP)
            }
        }
        fill.color = color
        if (gradient == null && Color.alpha(color) == 0) return
        if (r > 0.5f) canvas.drawRoundRect(rect, r, r, fill) else canvas.drawRect(rect, fill)
        fill.shader = null
    }

    override fun strokeRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, thickness: Float, color: Int,
    ) {
        if (w <= 0f || h <= 0f) return
        // EVG keeps a border's band INSIDE the box; Skia centres a stroke on
        // the path, so the rectangle moves in by half the thickness.
        val half = thickness / 2f
        rect.set(x + half, y + half, x + w - half, y + h - half)
        stroke.color = color
        stroke.strokeWidth = thickness
        val r = (radius - half).coerceAtLeast(0f)
        if (r > 0.5f) canvas.drawRoundRect(rect, r, r, stroke) else canvas.drawRect(rect, stroke)
    }

    override fun fillPath(
        pts: List<Double>, ringEnds: List<Int>, evenOdd: Boolean,
        color: Int, shadow: EvgShadow?,
    ) {
        if (!buildPath(pts, ringEnds, close = true)) return
        path.fillType = if (evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
        shadow?.let { drawShadowPath(it) }
        fill.shader = null
        fill.color = color
        canvas.drawPath(path, fill)
    }

    override fun strokePath(pts: List<Double>, ringEnds: List<Int>, thickness: Float, color: Int) {
        if (!buildPath(pts, ringEnds, close = false)) return
        stroke.color = color
        stroke.strokeWidth = thickness
        stroke.strokeJoin = Paint.Join.ROUND
        stroke.strokeCap = Paint.Cap.ROUND
        canvas.drawPath(path, stroke)
    }

    override fun drawImage(
        src: String, x: Float, y: Float, w: Float, h: Float,
        radius: Float, flipH: Boolean, flipV: Boolean,
    ) {
        if (w <= 0f || h <= 0f) return
        val bmp = images.bitmap(src)
        if (bmp == null) {
            // A picture the package did not carry must look different from an
            // empty slide, or a decoding bug reads as a design choice.
            rect.set(x, y, x + w, y + h)
            fill.shader = null
            fill.color = Color.rgb(180, 198, 230)
            canvas.drawRect(rect, fill)
            return
        }
        val saved = canvas.save()
        if (radius > 0.5f) {
            rect.set(x, y, x + w, y + h)
            path.reset()
            path.addRoundRect(rect, radius, radius, Path.Direction.CW)
            canvas.clipPath(path)
        }
        val m = Matrix()
        m.setScale(w / bmp.width, h / bmp.height)
        m.postTranslate(x, y)
        if (flipH || flipV) {
            // Mirroring is the texture read backwards, about the box's own
            // centre — the quad stays where the layout put it.
            val mm = Matrix()
            mm.setScale(if (flipH) -1f else 1f, if (flipV) -1f else 1f, x + w / 2f, y + h / 2f)
            m.postConcat(mm)
        }
        canvas.drawBitmap(bmp, m, fill.also { it.shader = null; it.color = Color.WHITE })
        canvas.restoreToCount(saved)
    }

    override fun drawTextRun(
        txt: String, x: Float, top: Float, sizePx: Float,
        family: String, bold: Boolean, italic: Boolean, color: Int,
    ) {
        if (sizePx <= 0f) return
        text.typeface = faces.typeface(family, bold, italic)
        text.textSize = sizePx
        text.color = color
        // `top` is the top of the line box; `ascent` is negative and is the
        // distance from the baseline up to it. Same rule as the WebGL atlas.
        canvas.drawText(txt, x, top - text.fontMetrics.ascent, text)
    }

    // --- the parts that are only arithmetic ----------------------------------

    private fun buildPath(pts: List<Double>, ringEnds: List<Int>, close: Boolean): Boolean {
        if (pts.size < 4) return false
        path.reset()
        var start = 0
        var any = false
        for (end in ringEnds) {
            val stop = if (end > pts.size) pts.size else end
            if (stop - start < 4) { start = stop; continue }
            path.moveTo(pts[start].toFloat(), pts[start + 1].toFloat())
            var i = start + 2
            while (i + 1 < stop) {
                path.lineTo(pts[i].toFloat(), pts[i + 1].toFloat())
                i += 2
            }
            if (close) path.close()
            any = true
            start = stop
        }
        return any
    }

    private fun drawShadowRect(box: RectF, radius: Float, shadow: EvgShadow) {
        prepareShadow(shadow)
        val moved = RectF(box)
        moved.offset(shadow.dx, shadow.dy)
        if (radius > 0.5f) {
            canvas.drawRoundRect(moved, radius, radius, shadowPaint)
        } else {
            canvas.drawRect(moved, shadowPaint)
        }
        shadowPaint.maskFilter = null
    }

    private fun drawShadowPath(shadow: EvgShadow) {
        prepareShadow(shadow)
        val saved = canvas.save()
        canvas.translate(shadow.dx, shadow.dy)
        canvas.drawPath(path, shadowPaint)
        canvas.restoreToCount(saved)
        shadowPaint.maskFilter = null
    }

    private fun prepareShadow(shadow: EvgShadow) {
        shadowPaint.color = shadow.color
        shadowPaint.maskFilter =
            if (canBlur && shadow.blur > 0.5f) BlurMaskFilter(shadow.blur, BlurMaskFilter.Blur.NORMAL) else null
    }
}

/**
 * The four faces the deck is measured and drawn in.
 *
 * EVG measured every run against these exact `.ttf` bytes, so the same files
 * have to be what Skia draws with — a substituted face would put the same
 * glyphs at widths the layout never agreed to.
 */
class FaceSet(
    private val regular: Typeface,
    private val bold: Typeface,
    private val italic: Typeface,
    private val boldItalic: Typeface,
) {
    fun typeface(@Suppress("UNUSED_PARAMETER") family: String, bold: Boolean, italic: Boolean): Typeface = when {
        bold && italic -> boldItalic
        bold -> this.bold
        italic -> this.italic
        else -> regular
    }
}

/** The deck's own pictures, decoded once and kept until another deck is opened. */
class ImageStore {
    private val bytes = HashMap<String, ByteArray>()
    private val decoded = HashMap<String, Bitmap?>()

    fun reset(parts: Map<String, ByteArray>) {
        bytes.clear()
        decoded.clear()
        bytes.putAll(parts)
    }

    fun bitmap(part: String): Bitmap? = decoded.getOrPut(part) {
        val raw = bytes[part] ?: return@getOrPut null
        runCatching { BitmapFactory.decodeByteArray(raw, 0, raw.size) }.getOrNull()
    }
}
