// ============================================================================
// Compile-time stubs for the Android platform classes this host uses.
// ============================================================================
//
// `AndroidEvgSurface`, `SlideView` and `MainActivity` are the three files that
// cannot be checked without an Android SDK, and an SDK is a 600 MB download
// from a host that is not always reachable. These declarations are enough for
// `kotlinc` to TYPE-CHECK those three files: every member below is one this
// host actually calls, with the signature the platform gives it.
//
// They are never compiled into the APK and never packaged. The real
// `android.jar` is on the compile classpath of the Gradle build and wins there;
// this file exists only for `scripts/typecheck-host.sh`.
//
// What this proves: the host's Kotlin is well-formed, its overrides match, its
// types line up, and it calls nothing that does not exist. What it does not
// prove: that the platform's implementations behave as the host expects — a
// stub cannot draw. Treat a green typecheck as "it will compile", not as
// "it works".
//
// If a signature here disagrees with the SDK, the Gradle build is the one that
// is right and this file is the one to fix.
// ============================================================================

@file:Suppress("UNUSED_PARAMETER", "unused")

package android.graphics

class Bitmap {
    @JvmField val width: Int = 0
    @JvmField val height: Int = 0
}

object BitmapFactory {
    fun decodeByteArray(data: ByteArray, offset: Int, length: Int): Bitmap? = null
}

class BlurMaskFilter(radius: Float, style: Blur) : MaskFilter() {
    enum class Blur { NORMAL, SOLID, OUTER, INNER }
}

open class MaskFilter

/**
 * `RuntimeShader` is AGSL — Skia's own shading language, handed to apps at API
 * 33. The constructor compiles, and it THROWS on a program it cannot compile,
 * which is why the host that builds one catches.
 */
class RuntimeShader(sksl: String) : Shader() {
    fun setFloatUniform(name: String, value: Float) {}
    fun setFloatUniform(name: String, a: Float, b: Float) {}
    fun setFloatUniform(name: String, a: Float, b: Float, c: Float) {}
    fun setFloatUniform(name: String, a: Float, b: Float, c: Float, d: Float) {}
    fun setFloatUniform(name: String, values: FloatArray) {}
    fun setIntUniform(name: String, value: Int) {}
    fun setInputShader(name: String, shader: Shader) {}
}

/**
 * A post-process over a view's finished pixels. `createRuntimeShaderEffect`
 * renders the view into a texture, binds it to the named `uniform shader`, and
 * lets the program decide every pixel — the same stage the WebGL host runs its
 * surface effects in.
 */
class RenderEffect {
    companion object {
        fun createRuntimeShaderEffect(shader: RuntimeShader, uniformShaderName: String): RenderEffect =
            RenderEffect()

        fun createBlurEffect(radiusX: Float, radiusY: Float, tile: Shader.TileMode): RenderEffect =
            RenderEffect()
    }
}

open class Shader {
    enum class TileMode { CLAMP, REPEAT, MIRROR }
}

class LinearGradient(
    x0: Float, y0: Float, x1: Float, y1: Float,
    color0: Int, color1: Int, tile: Shader.TileMode,
) : Shader()

class Matrix {
    fun setScale(sx: Float, sy: Float) {}
    fun setScale(sx: Float, sy: Float, px: Float, py: Float) {}
    fun postTranslate(dx: Float, dy: Float) {}
    fun postConcat(other: Matrix) {}
}

class RectF() {
    constructor(src: RectF) : this()
    fun set(l: Float, t: Float, r: Float, b: Float) {}
    fun offset(dx: Float, dy: Float) {}
}

class Path {
    enum class FillType { WINDING, EVEN_ODD, INVERSE_WINDING, INVERSE_EVEN_ODD }
    enum class Direction { CW, CCW }

    var fillType: FillType = FillType.WINDING
    fun reset() {}
    fun moveTo(x: Float, y: Float) {}
    fun lineTo(x: Float, y: Float) {}
    fun close() {}
    fun addRoundRect(rect: RectF, rx: Float, ry: Float, dir: Direction) {}
}

class Typeface {
    companion object {
        val DEFAULT: Typeface = Typeface()
        val DEFAULT_BOLD: Typeface = Typeface()
        const val NORMAL = 0
        const val BOLD = 1
        const val ITALIC = 2
        const val BOLD_ITALIC = 3
        fun createFromFile(path: java.io.File): Typeface = Typeface()
        fun create(family: Typeface?, style: Int): Typeface = Typeface()
    }
}

object Color {
    const val WHITE: Int = -1
    fun alpha(color: Int): Int = 0
    fun rgb(r: Int, g: Int, b: Int): Int = 0
}

class Paint() {
    constructor(flags: Int) : this()

    companion object {
        const val ANTI_ALIAS_FLAG = 1
        const val SUBPIXEL_TEXT_FLAG = 128
    }

    enum class Style { FILL, STROKE, FILL_AND_STROKE }
    enum class Join { MITER, ROUND, BEVEL }
    enum class Cap { BUTT, ROUND, SQUARE }

    class FontMetrics {
        @JvmField var ascent: Float = 0f
        @JvmField var descent: Float = 0f
        @JvmField var leading: Float = 0f
    }

    var color: Int = 0
    var style: Style = Style.FILL
    var shader: Shader? = null
    var maskFilter: MaskFilter? = null
    var strokeWidth: Float = 0f
    var strokeJoin: Join = Join.MITER
    var strokeCap: Cap = Cap.BUTT
    var typeface: Typeface? = null
    var textSize: Float = 0f
    val fontMetrics: FontMetrics = FontMetrics()
    fun measureText(text: String): Float = 0f
}

open class Canvas {
    val isHardwareAccelerated: Boolean = false
    fun save(): Int = 0
    fun restore() {}
    fun restoreToCount(count: Int) {}
    fun clipRect(left: Float, top: Float, right: Float, bottom: Float): Boolean = true
    fun clipPath(path: Path): Boolean = true
    fun rotate(degrees: Float, px: Float, py: Float) {}
    fun scale(sx: Float, sy: Float) {}
    fun translate(dx: Float, dy: Float) {}
    fun drawColor(color: Int) {}
    fun drawRect(rect: RectF, paint: Paint) {}
    fun drawRoundRect(rect: RectF, rx: Float, ry: Float, paint: Paint) {}
    fun drawPath(path: Path, paint: Paint) {}
    fun drawText(text: String, x: Float, y: Float, paint: Paint) {}
    fun drawBitmap(bitmap: Bitmap, matrix: Matrix, paint: Paint?) {}
}
