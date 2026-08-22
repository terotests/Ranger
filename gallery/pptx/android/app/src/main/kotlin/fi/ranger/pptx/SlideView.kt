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
import fi.ranger.pptx.input.TouchRouter
import fi.ranger.pptx.rgr.PptxAndroid

/**
 * The viewer, on screen.
 *
 * The whole of the application is [PptxAndroid] — a Ranger program compiled to
 * Kotlin — and the whole of this class is the four things it cannot do: own a
 * surface, receive touches, know what a second is, and know how big it is.
 *
 * What a touch *means* is [TouchRouter]'s, not this class's. That is not
 * tidiness: this file is the one part of the port that cannot run without a
 * device, so every rule that lives here is a rule nothing can check. The
 * detectors below turn `MotionEvent`s into named gestures and hand them over;
 * the router decides, and is driven directly by `CheckPort` on a JVM.
 *
 * **Units.** The app is sized and hit-tested in *density-independent* pixels
 * and the canvas is scaled by the display density instead. A 30dp toolbar is
 * then a touchable 30dp on a phone and on a tablet, while the text and the
 * vector shapes still rasterise at the panel's real resolution, because they
 * are drawn through the scale rather than blitted from a bitmap that was made
 * at some other size. It is the same trick the WebGL host plays with `dpr`.
 */
class SlideView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    val app = PptxAndroid()
    val images = ImageStore()
    val touch = TouchRouter(app)
    var faces: FaceSet? = null

    /** Called with "open" / "saveAs" when the app asks the host for a file. */
    var onFileRequest: ((String) -> Unit)? = null

    /** Called after anything that may have changed the slide or the mode. */
    var onStateChanged: (() -> Unit)? = null

    private val density = resources.displayMetrics.density
    private var started = false
    private var lastFrameNanos = 0L

    private val scaleDetector = ScaleGestureDetector(
        context,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(d: ScaleGestureDetector): Boolean {
                if (!touch.pinch(d.scaleFactor, d.focusX, d.focusY)) return false
                invalidate()
                return true
            }
        },
    )

    /**
     * The detectors **observe**; they never swallow.
     *
     * `GestureDetector.onTouchEvent` returns whatever the listener returned,
     * and `onDown` returning true — which is what every example writes, because
     * most views want the detector to own the stream — makes it return true for
     * every `ACTION_DOWN`. A host that then treats that as "handled" and stops
     * has just eaten the press. The viewer never sees a finger land, so nothing
     * on the toolbar, the slide panel or the page responds at all, while the
     * page still renders perfectly: exactly the shape of "it drew but nothing
     * worked". Every callback here returns false for that reason, and
     * [onTouchEvent] ignores the return value in any case.
     */
    private val gestureDetector = GestureDetector(
        context,
        object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent) = false

            override fun onSingleTapUp(e: MotionEvent): Boolean {
                if (touch.tap(e.x)) afterInput()
                return false
            }

            override fun onDoubleTap(e: MotionEvent): Boolean {
                if (touch.doubleTap()) invalidate()
                return false
            }

            override fun onScroll(e1: MotionEvent?, e2: MotionEvent, dx: Float, dy: Float): Boolean {
                if (touch.drag(dx, dy)) invalidate()
                return false
            }

            override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
                if (e1 == null) return false
                if (touch.fling(e1.x, vx, vy)) afterInput()
                return false
            }
        },
    )

    /** The faces to draw with. Called once the assets are read. */
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
            // A viewer opens as a viewer. `PptxApp` starts in EDIT mode, where a
            // press on the page picks a shape up or pulls out a rubber band —
            // which is right for a mouse on a desktop and wrong for a finger on
            // a deck someone is reading: every tap would drag something. The
            // strip's own toggle turns it back on, and going through the command
            // keeps whatever else `setEditMode` maintains.
            if (app.editing()) touch.command("edit.toggle")
        } else {
            app.resize(dw, dh)
        }
        touch.density = density
        touch.viewWidthPx = w
        touch.viewHeightPx = h
        onStateChanged?.invoke()
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        if (!started) return
        canvas.drawColor(Color.rgb(40, 44, 58))
        val saved = canvas.save()
        canvas.scale(density * touch.zoom, density * touch.zoom)
        canvas.translate(-touch.panX, -touch.panY)
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

    /**
     * Both detectors get every event, and so does the viewer.
     *
     * Nothing here consumes: a press the viewer never sees is a press it never
     * releases, and half a drag left open inside the app is worse than a
     * gesture that did not fire. The router is the one that decides whether a
     * pointer means anything in the mode the app is currently in, and whether a
     * flick that also dragged something should turn the page.
     */
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!started) return false
        scaleDetector.onTouchEvent(event)
        gestureDetector.onTouchEvent(event)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> touch.down(event.x, event.y)
            MotionEvent.ACTION_MOVE -> touch.move(event.x, event.y)
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> touch.up(event.x, event.y)
            else -> return true
        }
        afterInput()
        return true
    }

    /** A menu item, a hardware key, a remote: the app's own command table. */
    fun run(commandId: String, arg: String = "") {
        touch.command(commandId, arg)
        afterInput()
    }

    fun startShow() {
        touch.startShow()
        afterInput()
    }

    /** True when the show was running and this ended it — for the Back key. */
    fun endShow(): Boolean {
        if (!touch.endShow()) return false
        afterInput()
        return true
    }

    fun afterInput() {
        val want = app.takeFileRequest()
        if (want.isNotEmpty()) onFileRequest?.invoke(want)
        onStateChanged?.invoke()
        invalidate()
    }
}
