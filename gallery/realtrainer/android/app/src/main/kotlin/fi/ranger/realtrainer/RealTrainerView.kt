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
import fi.ranger.evg.EvgEngineThread
import fi.ranger.evg.EvgPainter
import fi.ranger.evg.FaceSet
import fi.ranger.evg.ImageStore
import fi.ranger.rgr.EVGDisplayList
import fi.ranger.rgr.RtAndroid

/**
 * What the painter needs, read on the engine thread beside the list so the
 * UI thread reads the app for nothing.
 */
class RtFrame(val list: EVGDisplayList, val scale: Double)

/**
 * The RealTrainer demo, on screen.
 *
 * The whole of the page is [RtAndroid] — `gallery/realtrainer/src/RealTrainerDemo.rgr`
 * behind its Android facade, compiled to Kotlin — and the whole of this class
 * is the five things it cannot do: own a surface, receive touches, know what a
 * second is, know how big it is, and talk to the input method.
 *
 * **The engine is not on this thread.** `app` is made here and then never
 * touched from the UI thread again: every call goes through [EvgEngineThread]
 * (`gallery/evg/android`), which runs it on the engine's own thread, in
 * order, and hands back a frame — the display list and the scale the painter
 * needs — when a call changed the page. [onDraw] paints the last frame it was
 * given and reads the app for nothing, so a layout that takes twelve
 * milliseconds blocks neither the touch nor the animation clock.
 * (PLAN_NATIVE_HOSTS.md S1.)
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

    /** The engine thread. Every call to [app] below goes through it. */
    private val engine = EvgEngineThread<RtAndroid, RtFrame>(
        app,
        { a -> RtFrame(a.frame(), a.scale()) },
        { r -> post(r) },
        { f -> frameArrived(f) },
    )

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
     * The last frame the engine handed over. [onDraw] paints this and only
     * this; it is replaced when the next one arrives and never dropped, so
     * the screen shows the page as it was until it can show it as it is.
     */
    private var frame: RtFrame? = null

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
                val fx = (-dx / density).toDouble()
                val fy = (-dy / density).toDouble()
                engine.post { a -> a.panBy(fx, fy) }
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
            started = true
            val c = css
            val k = compact
            val p = plan
            val ch = chat
            val s = seed
            engine.ask({ a ->
                a.start(dw, dh, c, k, p, ch, s)
                (0 until a.styleErrorCount()).map { a.styleErrorAt(it) }
            }) { errors ->
                for (e in errors) Log.w(TAG, "css: $e")
            }
        } else {
            engine.post { a -> a.resize(dw, dh); true }
        }
        changed()
    }

    /** A frame came off the engine thread: keep it, and draw. */
    private fun frameArrived(f: RtFrame) {
        frame = f
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val f = frame ?: return
        canvas.drawColor(Color.rgb(250, 250, 250))
        val saved = canvas.save()
        val s = (density * f.scale).toFloat()
        canvas.scale(s, s)
        EvgPainter.paint(f.list, AndroidEvgSurface(canvas, images, faces))
        canvas.restoreToCount(saved)

        advanceFling()
    }

    /**
     * One frame of a fling, and only while one is in flight. The decay is per
     * second rather than per frame, so a 120 Hz panel and a 60 Hz one come to
     * rest after the same distance. The pan itself is the engine's; whether
     * it still moved comes back a message later and ends the fling if not.
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
            val travel = (flingDpPerSec * dt).toDouble()
            engine.ask({ a -> a.panBy(0.0, travel) }) { moved ->
                if (moved) engine.invalidate() else flingDpPerSec = 0f
            }
            flingDpPerSec *= Math.pow(0.15, dt.toDouble()).toFloat()
            // Under 40dp/s is a page that has stopped, and a page that has hit
            // the end of its travel has stopped whatever the number says.
            if (Math.abs(flingDpPerSec) < 40f) flingDpPerSec = 0f
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
                engine.post { a -> a.pressAt(x, y); true }
                changed()
            }
            MotionEvent.ACTION_MOVE -> {
                // The detector above owns what a drag MEANS; the press itself
                // is dropped by the facade once the travel says so.
            }
            MotionEvent.ACTION_UP -> {
                engine.post { a -> a.releasePress(); true }
                syncKeyboard()
                changed()
            }
            MotionEvent.ACTION_CANCEL -> {
                engine.post { a -> a.cancelPress(); true }
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
     * none has: the facade decides which, on every release. Asked after the
     * release, on the engine thread, so the answer is the focus the release
     * left.
     */
    private fun syncKeyboard() {
        engine.ask({ a -> a.focusedField() }) { field ->
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            if (imm != null) {
                if (field.isNotEmpty()) {
                    requestFocus()
                    imm.restartInput(this)
                    imm.showSoftInput(this, 0)
                } else {
                    imm.hideSoftInputFromWindow(windowToken, 0)
                }
            }
        }
    }

    /**
     * The one read the platform wants an answer to on the spot, so it waits
     * for the engine thread: whether a field has the focus.
     */
    private fun focusedFieldNow(): String = if (started) engine.sync { a -> a.focusedField() } else ""

    override fun onCheckIsTextEditor(): Boolean = focusedFieldNow().isNotEmpty()

    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
        if (focusedFieldNow().isEmpty()) return null
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
                    engine.post { a -> a.key("Enter", false, false) }
                } else {
                    engine.post { a -> a.typeText(s) }
                }
                changed()
                return true
            }

            override fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean {
                val before = beforeLength
                val after = afterLength
                engine.post { a ->
                    var any = false
                    var n = before
                    while (n > 0) {
                        if (a.key("Backspace", false, false)) any = true
                        n--
                    }
                    var m = after
                    while (m > 0) {
                        if (a.key("Delete", false, false)) any = true
                        m--
                    }
                    any
                }
                changed()
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
        val shift = event.isShiftPressed
        val ctrl = event.isCtrlPressed
        if (name.isNotEmpty()) {
            // A space is typed into a field and is a key everywhere else; the
            // engine decides which, beside the focus it holds.
            engine.post { a ->
                if (name == " " && a.focusedField().isNotEmpty()) a.typeText(" ") else a.key(name, shift, ctrl)
            }
            changed()
            if (name == "Escape" || name == "Enter") syncKeyboard()
            return true
        }
        // A printable key on a hardware keyboard, into the focused field.
        val ch = event.unicodeChar
        if (ch > 0) {
            val text = String(Character.toChars(ch))
            engine.post { a -> a.focusedField().isNotEmpty() && a.typeText(text) }
            changed()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    /**
     * One line per press. Every coordinate on this page is one of three
     * spaces — the event's physical pixels, the dp the facade is told about,
     * and the page's own, which here is the same as dp — and a host that
     * mixes two of them draws a page that looks right and answers a finger
     * somewhere else. The hit test is the engine's, so the line is written
     * from its thread.
     */
    private fun logTouch(event: MotionEvent, x: Double, y: Double) {
        val ex = event.x
        val ey = event.y
        val vw = width
        val vh = height
        engine.post { a ->
            Log.d(
                TAG,
                "down ev=($ex, $ey)px view=${vw}x${vh}px density=$density" +
                    " page=${a.pageWidth()}x${a.pageHeight()} dp=($x, $y)" +
                    " hit=${a.hitAt(x, y)} section=${a.sectionName()}",
            )
            false
        }
    }

    /**
     * The page changed: a frame is owed, and the clock has something to
     * advance. The frame on screen stays until the new one arrives.
     */
    private fun changed() {
        engine.invalidate()
        startTicking()
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
        val step = Math.min(dt, 64.0)
        engine.ask({ a -> a.tick(step) }) { moved ->
            if (moved) {
                engine.invalidate()
                ticking = true
                postOnAnimation(tick)
            } else {
                tickNanos = 0L
            }
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        engine.close()
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
