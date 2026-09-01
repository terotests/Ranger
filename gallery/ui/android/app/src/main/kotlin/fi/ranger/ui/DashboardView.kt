package fi.ranger.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import fi.ranger.evg.AndroidEvgSurface
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.FaceSet
import fi.ranger.evg.ImageStore
import fi.ranger.evg.RippleEffect
import fi.ranger.rgr.EVGDisplayList
import fi.ranger.rgr.UiAndroid

/**
 * The dashboard, on screen.
 *
 * The whole of the page is [UiAndroid] — `gallery/ui/demo/DashboardDemo.rgr`
 * compiled to Kotlin — and the whole of this class is the four things it cannot
 * do: own a surface, receive touches, know what a second is, and know how big
 * it is.
 *
 * What a gesture *means* is deliberately not decided here. The scale, the
 * coordinate conversion, the pinch's focus point and the pan's limits all live
 * in the facade, in Ranger, where `CheckDashboard` drives them on a JVM — this
 * file is the one part of the port that cannot run without a device, so every
 * rule that lived here would be a rule nothing can check.
 *
 * **Units.** A `MotionEvent` and a `Canvas` are in physical pixels; the facade
 * works in density-independent ones. So the sizes it is told and the
 * coordinates it is handed are divided by the display density, and the canvas
 * is scaled by density × the page's own fit instead. Text and vector shapes
 * then rasterise at the panel's real resolution rather than being blown up from
 * a bitmap made at some other size, which is why a pinch stays sharp.
 */
class DashboardView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    val app = UiAndroid()

    /** The demo's own stylesheet, read out of the assets by the activity. */
    var css: String = ""

    private val density = resources.displayMetrics.density
    private var started = false

    // The page has no pictures — every icon in the sidebar is a real vector
    // path, and the chart is geometry — so the store stays empty and is here
    // only because the shared surface takes one.
    private val images = ImageStore()

    /**
     * The platform's own sans, in four styles.
     *
     * The pptx port bundles the exact `.ttf` files EVG measured against,
     * because a deck's layout was computed from those metrics. This page was
     * not: `gallery/ui` lays out with EVG's own estimate, the same one the
     * browser build uses, and no font file would make the estimate truer. So
     * the honest choice is the platform's face — the browser draws with the
     * system's too.
     */
    private val faces = FaceSet(
        Typeface.DEFAULT,
        Typeface.DEFAULT_BOLD,
        Typeface.create(Typeface.DEFAULT, Typeface.ITALIC),
        Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC),
    )

    /**
     * The last frame, kept until something changes it.
     *
     * `UiAndroid.frame()` lays the page out and runs the chart's Vega runtime;
     * that is the right cost for a page that changed and the wrong one for a
     * repaint that was asked for by an animation. Every path below that touches
     * the page goes through [changed], which is the only thing that drops this.
     */
    private var frame: EVGDisplayList? = null

    /**
     * The surface's ripple, which is a post-process rather than anything in the
     * display list — see [RippleEffect]. A no-op below API 33.
     */
    private val ripple = RippleEffect(this)
    private var rippleNanos = 0L
    private var rippleQueued = false

    // --- the fling ------------------------------------------------------------
    // Android's `OverScroller` would do this, and would also mean an AndroidX
    // dependency's worth of behaviour this host cannot check off-device. The
    // page's own scroll container already clamps, so a fling is just a velocity
    // that decays: a number, a decay constant and the frame clock.
    private var flingDpPerSec = 0f
    private var lastFrameNanos = 0L

    private val scaleDetector = ScaleGestureDetector(
        context,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(d: ScaleGestureDetector): Boolean {
                val zoomed = app.pinch(
                    d.scaleFactor.toDouble(),
                    (d.focusX / density).toDouble(),
                    (d.focusY / density).toDouble(),
                )
                if (zoomed) changed()
                return true
            }
        },
    )

    /**
     * The detectors **observe**; they never swallow.
     *
     * `GestureDetector.onTouchEvent` returns whatever its listener returned, and
     * `onDown` returning true — which is what almost every example writes —
     * makes it return true for every `ACTION_DOWN`. A host that treats that as
     * "handled" and stops has eaten the press: the page never learns a finger
     * landed, so nothing on it responds while it still renders perfectly. Every
     * callback here returns false, and [onTouchEvent] ignores the return value.
     */
    private val gestureDetector = GestureDetector(
        context,
        object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent) = false

            override fun onDoubleTap(e: MotionEvent): Boolean {
                if (app.resetZoom()) changed()
                return false
            }

            /**
             * A drag scrolls the page, and — only when there is something to
             * pan, which is only when zoomed in — moves sideways too.
             *
             * `distanceY` is how far the CONTENT should move, which is the
             * opposite sign to the finger, and is already what the scroll
             * container wants.
             */
            override fun onScroll(e1: MotionEvent?, e2: MotionEvent, dx: Float, dy: Float): Boolean {
                var moved = app.scrollByScreen((dy / density).toDouble())
                if (app.panBy((-dx / density).toDouble())) moved = true
                if (moved) {
                    // A drag that scrolls is not a drag that presses. Whatever
                    // the finger landed on stops being lit the moment the page
                    // moves under it, which is what a touch interface does.
                    app.releasePress()
                    changed()
                }
                return false
            }

            override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
                flingDpPerSec = -vy / density
                if (flingDpPerSec != 0f) postInvalidateOnAnimation()
                return false
            }
        },
    )

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val dw = (w / density).toDouble().coerceAtLeast(1.0)
        val dh = (h / density).toDouble().coerceAtLeast(1.0)
        if (!started) {
            app.start(dw, dh, css)
            started = true
        } else {
            app.resize(dw, dh)
        }
        changed()
    }

    override fun onDraw(canvas: Canvas) {
        if (!started) return
        canvas.drawColor(Color.rgb(250, 250, 250))
        val saved = canvas.save()
        val s = (density * app.scale()).toFloat()
        canvas.scale(s, s)
        // In PAGE pixels, because the scale is already on: panning is a
        // property of the document, not of the screen.
        canvas.translate(-app.panX().toFloat(), 0f)
        EvgPainter.paint(frameNow(), AndroidEvgSurface(canvas, images, faces))
        canvas.restoreToCount(saved)

        advanceFling()
    }

    /**
     * One frame of a fling, and only while one is in flight: a still page costs
     * nothing on a battery.
     *
     * The decay is per second rather than per frame, so a 120 Hz panel and a
     * 60 Hz one come to rest after the same distance rather than the faster one
     * stopping twice as soon.
     */
    private fun advanceFling() {
        if (flingDpPerSec == 0f) {
            lastFrameNanos = 0L
            return
        }
        val now = System.nanoTime()
        val dt = if (lastFrameNanos == 0L) 0f else (now - lastFrameNanos) / 1_000_000_000f
        lastFrameNanos = now
        if (dt > 0f && dt < 1f) {
            val moved = app.scrollByScreen((flingDpPerSec * dt).toDouble())
            flingDpPerSec *= Math.pow(0.15, dt.toDouble()).toFloat()
            // Under 40dp/s is a page that has stopped, and a page that has hit
            // the end of its travel has stopped whatever the number says.
            if (!moved || Math.abs(flingDpPerSec) < 40f) flingDpPerSec = 0f
        }
        if (flingDpPerSec != 0f) postInvalidateOnAnimation()
    }

    /**
     * Both detectors get every event, and so does the page.
     *
     * Nothing here consumes: a press the page never sees is a press it never
     * releases.
     */
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!started) return false
        scaleDetector.onTouchEvent(event)
        gestureDetector.onTouchEvent(event)
        val x = (event.x / density).toDouble()
        val y = (event.y / density).toDouble()
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                // A fling in flight is stopped by a finger, the way every
                // scrolling surface behaves.
                flingDpPerSec = 0f
                requestFocus()
                app.pressAt(x, y)
                // The SURFACE reacts too, wherever the finger landed and
                // whatever it hit. The control never learns that anything
                // happened, which is the point of an effect over the finished
                // picture.
                app.rippleAt(x, y)
                startRipple()
                changed()
            }
            MotionEvent.ACTION_MOVE -> {
                // A finger dragged across the surface leaves a wake. The page
                // itself is not touched here — the detectors above own what a
                // drag MEANS — so this does not invalidate.
                app.rippleTo(x, y)
                startRipple()
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                app.rippleEnd()
                app.releasePress()
                changed()
            }
            else -> return true
        }
        return true
    }

    /**
     * The emulator has a keyboard, and so does a tablet with a case.
     *
     * The demo already knows what every key means — the range buttons are a
     * radio group, the table has a grid's key handling, and anything nothing
     * else wanted goes to the scroll region — so the host's whole job is to
     * name the keys the way the browser names them.
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        val name = when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
            KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            KeyEvent.KEYCODE_PAGE_UP -> "PageUp"
            KeyEvent.KEYCODE_PAGE_DOWN -> "PageDown"
            KeyEvent.KEYCODE_MOVE_HOME -> "Home"
            KeyEvent.KEYCODE_MOVE_END -> "End"
            KeyEvent.KEYCODE_ENTER -> "Enter"
            KeyEvent.KEYCODE_SPACE -> " "
            else -> ""
        }
        if (name.isEmpty()) return super.onKeyDown(keyCode, event)
        if (app.key(name)) changed()
        return true
    }

    /**
     * The page changed: the frame it was drawn from is no longer the page, and
     * the screen is no longer the frame.
     */
    private fun changed() {
        frame = null
        invalidate()
    }

    private fun frameNow(): EVGDisplayList {
        val f = frame ?: app.frame()
        frame = f
        return f
    }

    // --- the ripple's clock ---------------------------------------------------
    //
    // A ripple frame changes NOTHING about the page: the touches age, the
    // shader reads them, and the picture the effect is applied to is the one
    // that was already there. So this drives itself with `postOnAnimation`
    // rather than `invalidate` — the view is re-composited with new uniforms,
    // and the layout, the chart and the painter are not asked again.

    private fun startRipple() {
        if (!ripple.available) return
        if (rippleQueued) return
        rippleQueued = true
        rippleNanos = 0L
        postOnAnimation(rippleTick)
    }

    // The type is written out because the body names the value it is being
    // assigned to — inference cannot chase that, and says so.
    private val rippleTick: Runnable = Runnable {
        rippleQueued = false
        val now = System.nanoTime()
        val dt = if (rippleNanos == 0L) 0.0 else (now - rippleNanos) / 1_000_000.0
        rippleNanos = now
        // A frame that arrived after a second away — the app was backgrounded —
        // would age every touch out of existence in one step. Ageing it by
        // nothing instead lets the next frame do it properly.
        val busy = if (dt > 0.0 && dt < 250.0) app.tick(dt) else app.busy()
        syncRipple()
        if (busy) {
            rippleQueued = true
            postOnAnimation(rippleTick)
        } else {
            rippleNanos = 0L
            ripple.clear()
        }
    }

    private fun syncRipple() {
        if (!ripple.available) return
        val n = app.dropCount()
        if (n <= 0) {
            ripple.clear()
            return
        }
        val drops = FloatArray(n * 3)
        for (i in 0 until n) {
            drops[i * 3] = app.dropX(i).toFloat()
            drops[i * 3 + 1] = app.dropY(i).toFloat()
            drops[i * 3 + 2] = app.dropAge(i).toFloat()
        }
        ripple.update(
            frameNow(),
            drops,
            n,
            (density * app.scale()).toFloat(),
            app.panX().toFloat(),
        )
    }

    init {
        // Without both of these no key event is ever delivered to a view in a
        // touch-first window, and the keyboard support above would be dead code
        // that looks alive.
        isFocusable = true
        isFocusableInTouchMode = true
    }
}
