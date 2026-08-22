package fi.ranger.pptx.evg

/**
 * Everything a backend has to be able to draw, and nothing else.
 *
 * `EVGDisplayList` is eight command kinds of absolute pixels and resolved
 * colours — no tree, no units, no fonts to resolve. That is small enough that
 * a backend is a page of delegation rather than a renderer, which is the point:
 * `AndroidEvgSurface` paints with `android.graphics.Canvas`, `AwtEvgSurface`
 * paints the same list with `java.awt.Graphics2D`, and the walk that decides
 * what each command *means* ([EvgPainter]) is written once and shared.
 *
 * That second implementation is not decoration. An Android painter can only be
 * checked on a device or an emulator; the same painter driven through AWT
 * renders a deck to a PNG on any JVM, which is what makes the port testable in
 * CI at all.
 *
 * Geometry is in the app's own pixels. A host that wants device pixels scales
 * its canvas and leaves these numbers alone — text then rasterises at the
 * panel's real resolution instead of being blown up from a small bitmap.
 */
interface EvgSurface {
    /** Push the clip/transform stack. Paired with [restore]. */
    fun save()

    /** Pop back to the state the matching [save] recorded. */
    fun restore()

    /** Intersect the clip with this rectangle. Only ever inside a [save]. */
    fun clipRect(x: Float, y: Float, w: Float, h: Float)

    /** Turn the coordinate system `degrees` about (`px`, `py`). */
    fun rotate(degrees: Float, px: Float, py: Float)

    /**
     * A filled box, possibly rounded, possibly a two-stop gradient, possibly
     * under a drop shadow. The shadow is painted first and is the shape's own
     * silhouette — a rounded box casts a rounded shadow.
     */
    fun fillRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float,
        color: Int,
        gradient: EvgGradient?,
        shadow: EvgShadow?,
    )

    /** A stroked outline, drawn as a band of `thickness` INSIDE the box. */
    fun strokeRect(
        x: Float, y: Float, w: Float, h: Float,
        radius: Float, thickness: Float,
        color: Int,
    )

    /**
     * A filled vector outline. The rings are already flattened and already in
     * page coordinates; `ringEnds` gives the index in `pts` one past each
     * ring's last coordinate, so a shape with a hole arrives as two rings.
     */
    fun fillPath(
        pts: List<Double>, ringEnds: List<Int>, evenOdd: Boolean,
        color: Int,
        shadow: EvgShadow?,
    )

    /** The same rings, stroked rather than filled. */
    fun strokePath(
        pts: List<Double>, ringEnds: List<Int>,
        thickness: Float,
        color: Int,
    )

    /**
     * A picture, by the package part name the deck gave it. A surface that has
     * no bytes for `src` should draw the placeholder rather than nothing — a
     * missing texture and a blank slide look identical otherwise.
     */
    fun drawImage(
        src: String,
        x: Float, y: Float, w: Float, h: Float,
        radius: Float,
        flipH: Boolean, flipV: Boolean,
    )

    /**
     * One run, on one line, in one face.
     *
     * `top` is the top of the LINE BOX, not the baseline: EVG measured the run
     * with the same TrueType face the surface is about to draw it in, and the
     * baseline sits one face-ascent below. Placing the ink at `top` instead
     * lifts every run by the empty space above its capitals — a couple of
     * pixels on a caption, most of a line on a heading. The surface owns that
     * conversion because only it knows what its own font metrics say.
     */
    fun drawTextRun(
        text: String,
        x: Float, top: Float,
        sizePx: Float,
        family: String, bold: Boolean, italic: Boolean,
        color: Int,
    )
}

/** A two-stop linear gradient. `vertical` is EVG's `gradDir == 0`. */
data class EvgGradient(
    val color1: Int,
    val color2: Int,
    val vertical: Boolean,
)

/** An outer drop shadow: offset, blur radius, colour. */
data class EvgShadow(
    val dx: Float,
    val dy: Float,
    val blur: Float,
    val color: Int,
)
