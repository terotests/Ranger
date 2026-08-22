package fi.ranger.pptx

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import fi.ranger.pptx.evg.EvgPainter
import fi.ranger.pptx.rgr.PptxAndroid
import kotlin.math.abs

/**
 * The viewer, on screen.
 *
 * The whole of the application is [PptxAndroid] — a Ranger program compiled to
 * Kotlin — and the whole of this class is the three things it cannot do: own a
 * surface, receive touches, and know what a second is.
 *
 * **Units.** The app is sized and hit-tested in *density-independent* pixels
 * and the canvas is scaled by the display density instead. A 30dp toolbar is
 * then a touchable 30dp on a phone and on a tablet, while the text and the
 * vector shapes still rasterise at the panel's real resolution, because they
 * are drawn through the scale rather than blitted from a bitmap that was made
 * at some other size. It is the same trick the WebGL host plays with `dpr`.
 *
 * **Gestures.** A slide viewer wants two quite different interfaces and it is
 * clearer to say so than to blend them: while a show is running the screen *is*
 * the slide, so a tap turns the page and a pinch zooms into it; the rest of the
 * time the app has a toolbar and a slide panel of its own, so a touch is a
 * pointer and only a horizontal fling over the page means "next".
 */
class SlideView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    val app = PptxAndroid()
    val images = ImageStore()
    var faces: FaceSet? = null

    /** Called with "open" / "saveAs" when the app asks the host for a file. */
    var onFileRequest: ((String) -> Unit)? = null

    /** Called after anything that may have changed the slide or the mode. */
    var onStateChanged: (() -> Unit)? = null

    private val density = resources.displayMetrics.density
    private var started = false
    private var lastFrameNanos = 0L

    // Zoom lives in the host, not the app: the app fits a slide to the window
    // it was given and has no idea what a finger is. Only meaningful during a
    // show, where the frame is the slide and nothing else.
    private var zoom = 1f
    private var panX = 0f
    private var panY = 0f

    private val scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScale(d: ScaleGestureDetector): Boolean {
            if (!app.presenting()) return false
            val before = zoom
            zoom = (zoom * d.scaleFactor).coerceIn(1f, 6f)
            // Keep the point under the fingers under the fingers.
            val fx = d.focusX / density
            val fy = d.focusY / density
            panX += fx / before - fx / zoom
            panY += fy / before - fy / zoom
            clampPan()
            invalidate()
            return true
        }
    })

    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onDown(e: MotionEvent) = true

        override fun onSingleTapUp(e: MotionEvent): Boolean {
            if (!app.presenting()) return false
            if (zoom > 1.01f) return false
            // The two halves of a slide are next and previous. Every remote,
            // every projector app and every PDF reader on a tablet does this.
            if (e.x > width / 2f) app.next() else app.prev()
            afterInput()
            return true
        }

        override fun onDoubleTap(e: MotionEvent): Boolean {
            if (!app.presenting()) return false
            zoom = 1f
            panX = 0f
            panY = 0f
            invalidate()
            return true
        }

        override fun onScroll(e1: MotionEvent?, e2: MotionEvent, dx: Float, dy: Float): Boolean {
            if (!app.presenting() || zoom <= 1.01f) return false
            panX += dx / (density * zoom)
            panY += dy / (density * zoom)
            clampPan()
            invalidate()
            return true
        }

        override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
            if (e1 == null) return false
            if (app.presenting() && zoom > 1.01f) return false
            if (abs(vx) < abs(vy) * 1.5f) return false
            // Outside a show the panel and the toolbar are the app's; a fling
            // only means "turn the page" when it started over the page.
            if (!app.presenting() && e1.x / density < app.slidePanelWidth()) return false
            if (vx < 0) app.next() else app.prev()
            afterInput()
            return true
        }
    })

    /**
     * The faces and the first deck. Called once the assets are read; the app is
     * sized here rather than in the constructor because a view does not know
     * how big it is until it is laid out.
     */
    fun install(faces: FaceSet) {
        this.faces = faces
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val dw = (w / density).toInt().coerceAtLeast(1)
        val dh = (h / density).toInt().coerceAtLeast(1)
        if (!started) {
            app.start(dw, dh)
            started = true
        } else {
            app.resize(dw, dh)
        }
        onStateChanged?.invoke()
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        if (!started) return
        canvas.drawColor(Color.rgb(40, 44, 58))
        val saved = canvas.save()
        canvas.scale(density * zoom, density * zoom)
        canvas.translate(-panX, -panY)
        EvgPainter.paint(app.frame(), AndroidEvgSurface(canvas, images, faces ?: return))
        canvas.restoreToCount(saved)

        // The show has a clock and the app has none. Ask for another frame only
        // while something is actually moving: a still slide costs nothing.
        if (app.animating()) {
            val now = System.nanoTime()
            val dt = if (lastFrameNanos == 0L) 0.0 else (now - lastFrameNanos) / 1_000_000_000.0
            lastFrameNanos = now
            if (dt > 0.0 && dt < 1.0) app.tick(dt)
            postInvalidateOnAnimation()
        } else {
            lastFrameNanos = 0L
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!started) return false
        scaleDetector.onTouchEvent(event)
        if (gestureDetector.onTouchEvent(event)) return true
        if (app.presenting()) return true

        val x = (event.x / density + panX).toInt()
        val y = (event.y / density + panY).toInt()
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> app.pointerAt(x, y, true, true, false)
            MotionEvent.ACTION_MOVE -> app.pointerAt(x, y, false, true, false)
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> app.pointerAt(x, y, false, false, true)
            else -> return true
        }
        afterInput()
        return true
    }

    /** A menu item, a hardware key, a remote: the app's own command table. */
    fun run(commandId: String, arg: String = "") {
        app.command(commandId, arg)
        afterInput()
    }

    fun startShow() {
        zoom = 1f
        panX = 0f
        panY = 0f
        app.command("show.start", "")
        afterInput()
    }

    /** True when the show was running and this ended it — for the Back key. */
    fun endShow(): Boolean {
        if (!app.presenting()) return false
        app.key("escape", false, false)
        zoom = 1f
        panX = 0f
        panY = 0f
        afterInput()
        return true
    }

    fun afterInput() {
        val want = app.takeFileRequest()
        if (want.isNotEmpty()) onFileRequest?.invoke(want)
        onStateChanged?.invoke()
        invalidate()
    }

    private fun clampPan() {
        val vw = width / (density * zoom)
        val vh = height / (density * zoom)
        val maxX = (app.width() - vw).coerceAtLeast(0f)
        val maxY = (app.height() - vh).coerceAtLeast(0f)
        panX = panX.coerceIn(0f, maxX)
        panY = panY.coerceIn(0f, maxY)
    }
}
