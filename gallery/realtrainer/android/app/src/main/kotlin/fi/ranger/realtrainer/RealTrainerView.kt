package fi.ranger.realtrainer

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Typeface
import android.util.AttributeSet
import android.util.Log
import android.view.GestureDetector
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.BaseInputConnection
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputMethodManager
import fi.ranger.evg.AndroidEvgSurface
import fi.ranger.evg.AndroidTextMeasurer
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.FaceSet
import fi.ranger.evg.ImageStore
import fi.ranger.rgr.EVGDisplayList
import fi.ranger.rgr.RtAndroid

/**
 * The RealTrainer demo, on screen.
 *
 * The whole of the page is [RtAndroid] — `gallery/realtrainer/src/RealTrainerDemo.rgr`
 * behind its Android facade, compiled to Kotlin — and the whole of this class
 * is the five things it cannot do: own a surface, receive touches, know what a
 * second is, know how big it is, and talk to the input method.
 *
 * What a gesture *means* is deliberately not decided here. The press that
 * survives a small move, the drag that drops it, the field that takes the
 * focus all live in the facade, in Ranger, where `check_rt_android.rgr`
 * drives them on Node — this file is the one part of the port that cannot run
 * without a device, so every rule that lived here would be a rule nothing can
 * check.
 *
 * **Units.** A `MotionEvent` and a `Canvas` are in physical pixels; the facade
 * works in density-independent ones. So the sizes it is told and the
 * coordinates it is handed are divided by the display density, and the canvas
 * is scaled by the density instead. Text and vector shapes then rasterise at
 * the panel's real resolution.
 *
 * **The page is the view.** There is no fit and no pinch: the demo is
 * responsive, and lays itself out at the view's size — a phone gets the bottom
 * bar, a tablet the rail — again on every `onSizeChanged`, which is also what
 * the keyboard is under `adjustResize`.
 */
class RealTrainerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    private val faces = FaceSet(
        Typeface.DEFAULT,
        Typeface.DEFAULT_BOLD,
        Typeface.create(Typeface.DEFAULT, Typeface.ITALIC),
        Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC),
    )

    /**
     * Skia measures the page's text before anything is laid out: declared
     * above `app`, because Kotlin initialises properties in order and the
     * app makes its first layout when it is made. The same [FaceSet] the
     * surface paints with, so the width measured is the width drawn.
     */
    private val textMeasurer = AndroidTextMeasurer.install(faces)

    val app = RtAndroid()

    /** The five texts, read out of the assets by the activity. */
    var css: String = ""
    var compact: String = ""
    var plan: String = ""
    var chat: String = ""
    var seed: String = ""

    private val density = resources.displayMetrics.density
    private var started = false

    /**
     * Print where a press landed and what it was turned into. One line per
     * press and nothing reads it but a person:
     *
     *   adb logcat -s RtTouch      (or `npm run rt:android:run -- --logcat`)
     */
    private val logTouches = true

    // The page's icons are vector paths and its charts are geometry, so the
    // store stays empty and is here only because the shared surface takes one.
    private val images = ImageStore()

    /**
     * The platform's own sans, in four styles. The page lays out with EVG's
     * own estimate, the same one the browser build uses, and no font file
     * would make the estimate truer — so the platform's face is the honest
     * choice, as it is on the AWT surface the desktop check paints with.
     */
    // `faces` is declared above `app` — see there.

    /**
     * The last frame, kept until something changes it. `RtAndroid.frame()`
     * lays the page out and runs the charts; that is the right cost for a page
     * that changed and the wrong one for a repaint an animation asked for.
     * Every path below that touches the page goes through [changed], which is
     * the only thing that drops this.
     */
    private var frame: EVGDisplayList? = null

    // --- the fling ------------------------------------------------------------
    // A velocity that decays, in dp of FINGER travel per second: the facade's
    // `panBy` takes the finger's travel and the page's own scroll container
    // clamps, so a fling is a number, a decay constant and the frame clock.
    private var flingDpPerSec = 0f
    private var lastFrameNanos = 0L

    // --- the clock ------------------------------------------------------------
    // The demo animates (transitions, the chat's typing) and answers `tick`
    // with whether anything moved. The loop runs while it does and stops the
    // frame it does not: a still page costs nothing on a battery.
    private var ticking = false
    private var tickNanos = 0L

    /**
     * The detector **observes**; it never swallows. `onDown` returning true
     * — which is what almost every example writes — would make the detector
     * report every `ACTION_DOWN` as handled, and a host that stopped there
     * has eaten the press. Every callback here returns false, and
     * [onTouchEvent] ignores the return value.
     */
    private val gestureDetector = GestureDetector(
        context,
        object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent) = false

            /**
             * A drag scrolls the page under the finger. `distanceY` is how
             * far the CONTENT should move, which is the opposite sign to the
             * finger; the facade wants the finger's travel and decides for
             * itself when a press has become a drag.
             */
            override fun onScroll(e1: MotionEvent?, e2: MotionEvent, dx: Float, dy: Float): Boolean {
                if (app.panBy((-dx / density).toDouble(), (-dy / density).toDouble())) changed()
                return false
            }

            override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
                flingDpPerSec = vy / density
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
            app.start(dw, dh, css, compact, plan, chat, seed)
            started = true
            for (i in 0 until app.styleErrorCount()) Log.w(TAG, "css: " + app.styleErrorAt(i))
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
        EvgPainter.paint(frameNow(), AndroidEvgSurface(canvas, images, faces))
        canvas.restoreToCount(saved)

        advanceFling()
    }

    /**
     * One frame of a fling, and only while one is in flight. The decay is per
     * second rather than per frame, so a 120 Hz panel and a 60 Hz one come to
     * rest after the same distance.
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
            val moved = app.panBy(0.0, (flingDpPerSec * dt).toDouble())
            flingDpPerSec *= Math.pow(0.15, dt.toDouble()).toFloat()
            // Under 40dp/s is a page that has stopped, and a page that has hit
            // the end of its travel has stopped whatever the number says.
            if (!moved || Math.abs(flingDpPerSec) < 40f) flingDpPerSec = 0f
            frame = null
        }
        if (flingDpPerSec != 0f) postInvalidateOnAnimation()
    }

    /**
     * The detector gets every event, and so does the page. Nothing here
     * consumes: a press the page never sees is a press it never releases.
     */
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!started) return false
        gestureDetector.onTouchEvent(event)
        val x = (event.x / density).toDouble()
        val y = (event.y / density).toDouble()
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                // A fling in flight is stopped by a finger.
                flingDpPerSec = 0f
                requestFocus()
                if (logTouches) logTouch(event, x, y)
                app.pressAt(x, y)
                changed()
            }
            MotionEvent.ACTION_MOVE -> {
                // The detector above owns what a drag MEANS; the press itself
                // is dropped by the facade once the travel says so.
            }
            MotionEvent.ACTION_UP -> {
                app.releasePress()
                syncKeyboard()
                changed()
            }
            MotionEvent.ACTION_CANCEL -> {
                app.cancelPress()
                changed()
            }
            else -> return true
        }
        return true
    }

    // --- the keyboard ---------------------------------------------------------
    //
    // Two keyboards reach a View. A hardware one — the emulator's, a tablet's
    // case — arrives as key events, and the demo already knows what every key
    // means, so the host's whole job is to name them the way the browser does.
    // The soft keyboard arrives through an InputConnection: the text it
    // commits goes into the focused field, and a delete is a Backspace.

    /**
     * The soft keyboard is shown while a field has the focus and hidden when
     * none has: the facade decides which, on every release.
     */
    private fun syncKeyboard() {
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager ?: return
        if (app.focusedField().isNotEmpty()) {
            requestFocus()
            imm.restartInput(this)
            imm.showSoftInput(this, 0)
        } else {
            imm.hideSoftInputFromWindow(windowToken, 0)
        }
    }

    override fun onCheckIsTextEditor(): Boolean = started && app.focusedField().isNotEmpty()

    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
        if (!started || app.focusedField().isEmpty()) return null
        // Plain text, no suggestions: the field is drawn by the page, and a
        // composing region the page cannot show is text the person cannot
        // see. Every commit lands in the field as it is typed.
        outAttrs.inputType = EditorInfo.TYPE_CLASS_TEXT or EditorInfo.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        outAttrs.imeOptions = EditorInfo.IME_ACTION_NONE or EditorInfo.IME_FLAG_NO_EXTRACT_UI
        return object : BaseInputConnection(this, false) {
            override fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean {
                val s = text?.toString() ?: return true
                if (s.isEmpty()) return true
                if (s == "\n") {
                    if (app.key("Enter", false, false)) changed()
                } else if (app.typeText(s)) {
                    changed()
                }
                return true
            }

            override fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean {
                var n = beforeLength
                while (n > 0) {
                    if (app.key("Backspace", false, false)) changed()
                    n--
                }
                var m = afterLength
                while (m > 0) {
                    if (app.key("Delete", false, false)) changed()
                    m--
                }
                return true
            }

            override fun setComposingText(text: CharSequence?, newCursorPosition: Int): Boolean =
                // A keyboard that composes is asked to commit instead: the
                // page has no composing region to draw.
                commitText(text, newCursorPosition)

            override fun finishComposingText(): Boolean = true
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (!started) return super.onKeyDown(keyCode, event)
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
            KeyEvent.KEYCODE_DEL -> "Backspace"
            KeyEvent.KEYCODE_FORWARD_DEL -> "Delete"
            KeyEvent.KEYCODE_TAB -> "Tab"
            KeyEvent.KEYCODE_ESCAPE -> "Escape"
            KeyEvent.KEYCODE_SPACE -> " "
            else -> ""
        }
        if (name.isNotEmpty()) {
            if (name == " " && app.focusedField().isNotEmpty()) {
                if (app.typeText(" ")) changed()
            } else if (app.key(name, event.isShiftPressed, event.isCtrlPressed)) {
                changed()
            }
            if (name == "Escape" || name == "Enter") syncKeyboard()
            return true
        }
        // A printable key on a hardware keyboard, into the focused field.
        val ch = event.unicodeChar
        if (ch > 0 && app.focusedField().isNotEmpty()) {
            if (app.typeText(String(Character.toChars(ch)))) changed()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    /**
     * One line per press. Every coordinate on this page is one of three
     * spaces — the event's physical pixels, the dp the facade is told about,
     * and the page's own, which here is the same as dp — and a host that
     * mixes two of them draws a page that looks right and answers a finger
     * somewhere else.
     */
    private fun logTouch(event: MotionEvent, x: Double, y: Double) {
        Log.d(
            TAG,
            "down ev=(${event.x}, ${event.y})px view=${width}x${height}px density=$density" +
                " page=${app.pageWidth()}x${app.pageHeight()} dp=($x, $y)" +
                " hit=${app.hitAt(x, y)} section=${app.sectionName()}",
        )
    }

    /**
     * The page changed: the frame it was drawn from is no longer the page, the
     * screen is no longer the frame, and the clock has something to advance.
     */
    private fun changed() {
        frame = null
        invalidate()
        startTicking()
    }

    private fun frameNow(): EVGDisplayList {
        val f = frame ?: app.frame()
        frame = f
        return f
    }

    private fun startTicking() {
        if (ticking) return
        ticking = true
        tickNanos = 0L
        postOnAnimation(tick)
    }

    // The type is written out because the body names the value it is being
    // assigned to — inference cannot chase that, and says so.
    private val tick: Runnable = Runnable {
        ticking = false
        val now = System.nanoTime()
        val dt = if (tickNanos == 0L) 16.0 else (now - tickNanos) / 1_000_000.0
        tickNanos = now
        // A frame that arrived a second late advances the page by one slow
        // frame's worth, not a second: a clamped clock is what keeps an
        // animation from jumping to its end after the app was in the
        // background.
        val moved = app.tick(Math.min(dt, 64.0))
        if (moved) {
            frame = null
            invalidate()
            ticking = true
            postOnAnimation(tick)
        } else {
            tickNanos = 0L
        }
    }

    private companion object {
        const val TAG = "RtTouch"
    }

    init {
        // Without both of these no key event is ever delivered to a view in a
        // touch-first window, and the keyboard support above would be dead
        // code that looks alive.
        isFocusable = true
        isFocusableInTouchMode = true
    }
}
