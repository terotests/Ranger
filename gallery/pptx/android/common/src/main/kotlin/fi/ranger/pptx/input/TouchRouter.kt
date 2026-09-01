package fi.ranger.pptx.input

import fi.ranger.rgr.PptxAndroid

/**
 * What a finger means, decided away from Android.
 *
 * This used to live inside `SlideView`, which put every rule about which half
 * of the screen turns the page, which flings count, and how a pinch moves the
 * page into the one file in this port that cannot be run without a device. The
 * rules are arithmetic and a handful of `if`s; only the `MotionEvent` plumbing
 * needs Android, so only that is left there.
 *
 * Everything here is in two coordinate spaces and the whole class is really
 * about the conversion between them:
 *
 *  * **view pixels** — what a touch event carries, what the canvas is sized in;
 *  * **app units** — density-independent pixels, which is what the viewer was
 *    laid out in and the only thing it will accept.
 *
 * `app = view / (density * zoom) + pan`. Getting the `zoom` out of that
 * division is the difference between a tap landing where you put it and a tap
 * landing somewhere towards the top-left corner, the further in you are zoomed.
 *
 * A slide viewer wants two quite different interfaces and it is clearer to say
 * so than to blend them. While a show is running the screen *is* the slide: a
 * tap turns the page, a pinch zooms into it, a drag moves it. The rest of the
 * time the viewer has a toolbar and a slide panel of its own, so a touch is a
 * pointer and only a horizontal fling that started over the page means "next".
 */
class TouchRouter(
    /** The viewer. Owned by the caller; this only ever calls it. */
    val app: PptxAndroid,
) {
    /** Display density: view pixels per app unit, before any zoom. */
    var density: Float = 1f

    /** The surface's size in view pixels. Only used to bound the pan. */
    var viewWidthPx: Int = 0
    var viewHeightPx: Int = 0

    var zoom: Float = 1f
        private set
    var panX: Float = 0f
        private set
    var panY: Float = 0f
        private set

    /** Below this a zoom is "not zoomed": a pinch never lands exactly on 1. */
    private val zoomedIn: Boolean get() = zoom > 1f + ZOOM_EPSILON

    /**
     * Whether the viewer took the press this gesture started with.
     *
     * A flick is decided on the way up, by which time the app has already had
     * the press and the moves — so on a deck being *edited* a swipe has already
     * dragged a shape or pulled out a rubber band, and turning the page on top
     * of that would leave the edit behind. The app's own answer settles it: in
     * edit mode a press on the page is taken (it starts a drag or a marquee) and
     * the flick is not ours; in view mode the app takes nothing on the page and
     * a flick is unambiguous. Asking the app beats keeping a copy of its mode.
     */
    private var pressWentToApp = false

    // --- coordinates ---------------------------------------------------------

    fun appX(viewPx: Float): Int = (viewPx / (density * zoom) + panX).toInt()

    fun appY(viewPy: Float): Int = (viewPy / (density * zoom) + panY).toInt()

    // --- the pointer, outside a show -----------------------------------------

    fun down(viewPx: Float, viewPy: Float): Boolean {
        if (app.presenting()) {
            pressWentToApp = false
            return true
        }
        pressWentToApp = app.pointerAt(appX(viewPx), appY(viewPy), true, true, false)
        return true
    }

    /** Whether the viewer claimed the press this gesture began with. */
    fun pressTaken(): Boolean = pressWentToApp

    fun move(viewPx: Float, viewPy: Float): Boolean {
        if (app.presenting()) return true
        app.pointerAt(appX(viewPx), appY(viewPy), false, true, false)
        return true
    }

    fun up(viewPx: Float, viewPy: Float): Boolean {
        if (app.presenting()) return true
        app.pointerAt(appX(viewPx), appY(viewPy), false, false, true)
        return true
    }

    /** A press and a release in the same place, which is what a tap is. */
    fun press(viewPx: Float, viewPy: Float): Boolean {
        val a = down(viewPx, viewPy)
        val b = up(viewPx, viewPy)
        return a || b
    }

    // --- gestures ------------------------------------------------------------

    /**
     * A tap. Only means anything during a show, and only while the slide is
     * shown whole: once zoomed in, a tap is how you look at something rather
     * than how you leave it.
     */
    fun tap(viewPx: Float): Boolean {
        if (!app.presenting()) return false
        if (zoomedIn) return false
        if (viewWidthPx > 0 && viewPx > viewWidthPx / 2f) app.next() else app.prev()
        return true
    }

    /** Back to fit. */
    fun doubleTap(): Boolean {
        if (!app.presenting()) return false
        resetView()
        return true
    }

    /**
     * A flick sideways turns the page. Outside a show the panel and the strip
     * belong to the app, so a flick only means "next" when it *started* over
     * the page — otherwise scrolling the slide panel would turn the deck.
     */
    fun fling(startViewPx: Float, velocityX: Float, velocityY: Float): Boolean {
        if (app.presenting() && zoomedIn) return false
        // Mostly-vertical is a scroll, not a page turn. The 1.5 keeps a
        // diagonal flick from counting as both.
        if (abs(velocityX) < abs(velocityY) * 1.5f) return false
        if (!app.presenting()) {
            if (appX(startViewPx) < app.slidePanelWidth()) return false
            // The press this flick began with belongs to whoever answered for
            // it. See `pressWentToApp`.
            if (pressWentToApp) return false
        }
        if (velocityX < 0) app.next() else app.prev()
        return true
    }

    /**
     * A pinch. The point under the fingers stays under the fingers, which is
     * the whole of what makes a zoom feel attached to the page:
     *
     *     app = view / (d * z) + pan   held constant across a change in z
     *     pan1 = pan0 + view / (d * z0) - view / (d * z1)
     */
    fun pinch(scaleFactor: Float, focusViewPx: Float, focusViewPy: Float): Boolean {
        if (!app.presenting()) return false
        val before = zoom
        zoom = (zoom * scaleFactor).coerceIn(MIN_ZOOM, MAX_ZOOM)
        if (zoom == before) return true
        panX += focusViewPx / density / before - focusViewPx / density / zoom
        panY += focusViewPy / density / before - focusViewPy / density / zoom
        clampPan()
        return true
    }

    /** A drag while zoomed in moves the page under the finger. */
    fun drag(deltaViewPx: Float, deltaViewPy: Float): Boolean {
        if (!app.presenting() || !zoomedIn) return false
        panX += deltaViewPx / (density * zoom)
        panY += deltaViewPy / (density * zoom)
        clampPan()
        return true
    }

    // --- keys and the show ---------------------------------------------------

    fun startShow(): Boolean {
        resetView()
        app.command("show.start", "")
        return true
    }

    /** True when a show was running and this ended it — what Back needs. */
    fun endShow(): Boolean {
        if (!app.presenting()) return false
        app.key("escape", false, false)
        resetView()
        return true
    }

    fun command(id: String, arg: String = ""): Boolean {
        app.command(id, arg)
        return true
    }

    fun key(name: String, shift: Boolean = false, ctrl: Boolean = false): Boolean {
        app.key(name, shift, ctrl)
        return true
    }

    /** The wheel, or a two-finger scroll over the slide panel. */
    fun scroll(viewPx: Float, viewPy: Float, notches: Int): Boolean {
        app.scroll(appX(viewPx), appY(viewPy), notches)
        return true
    }

    fun resetView() {
        zoom = 1f
        panX = 0f
        panY = 0f
    }

    /**
     * A pan never shows anything outside the page. With nothing zoomed, or with
     * a view bigger than the page, that leaves the only legal pan at zero.
     */
    private fun clampPan() {
        val visibleW = if (density * zoom > 0f) viewWidthPx / (density * zoom) else 0f
        val visibleH = if (density * zoom > 0f) viewHeightPx / (density * zoom) else 0f
        val maxX = (app.width() - visibleW).coerceAtLeast(0f)
        val maxY = (app.height() - visibleH).coerceAtLeast(0f)
        panX = panX.coerceIn(0f, maxX)
        panY = panY.coerceIn(0f, maxY)
    }

    private fun abs(v: Float): Float = if (v < 0f) -v else v

    private companion object {
        const val MIN_ZOOM = 1f
        const val MAX_ZOOM = 6f
        const val ZOOM_EPSILON = 0.01f
    }
}
