// SPDX-License-Identifier: AGPL-3.0-or-later
package fi.ranger.evg

import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * The engine off the UI thread — Android, and the JVM.
 *
 * PLAN_NATIVE_HOSTS.md S1. A Ranger app compiled to Kotlin has no `android.*`
 * in it, so nothing about it has to run on the UI thread; what has to is the
 * `View` that receives touches and the `Canvas` that paints. So the app lives
 * on ONE thread of its own, every call the host makes runs there in the order
 * the host made it, and a call that changed the page produces a frame — laid
 * out and listed on that thread — that is handed to the UI thread, which
 * paints it and nothing else.
 *
 * Three verbs, and the discipline is that a host uses them and never touches
 * the app directly:
 *
 *   post { app -> … }            run there; return true if a frame is owed
 *   ask({ app -> … }) { v -> … } run there; answer on the UI thread
 *   sync { app -> … }            run there and WAIT — for the one read the
 *                                platform insists on synchronously
 *                                (`onCheckIsTextEditor`)
 *
 * Frames are coalesced: a burst of posts that each say "a frame is owed"
 * produces one build after the last of them, and a build asked for while one
 * is running produces exactly one more when it finishes — never a queue of
 * stale frames the UI thread has to draw through.
 *
 * This file is in the platform-free source set on purpose: `onMain` is how
 * the host reaches its UI thread (`view::post` on Android, `SwingUtilities`
 * or a plain call on a JVM check), so the same class serves both.
 *
 * @param app the Ranger app; make it BEFORE this, and never read it again
 *   from the UI thread
 * @param build the frame, run on the engine thread — `app.frame()` and
 *   whatever the painter needs beside it
 * @param onMain run a block on the UI thread
 * @param deliver called on the UI thread with each built frame; keep it and
 *   `invalidate()`
 */
class EvgEngineThread<App, Frame>(
    private val app: App,
    private val build: (App) -> Frame,
    private val onMain: (Runnable) -> Unit,
    private val deliver: (Frame) -> Unit,
) {
    private val exec = Executors.newSingleThreadExecutor { r ->
        Thread(r, "evg-engine").apply { isDaemon = true }
    }

    // Touched on the engine thread only.
    private var building = false
    private var wanted = false
    private val closed = AtomicBoolean(false)

    /** Run `work` on the engine thread. A `true` result asks for a frame. */
    fun post(work: (App) -> Boolean) {
        if (closed.get()) return
        exec.execute {
            if (work(app)) requestFrameOnThread()
        }
    }

    /** Run `work` on the engine thread and hand its answer to `then` on the UI thread. */
    fun <T> ask(work: (App) -> T, then: (T) -> Unit) {
        if (closed.get()) return
        exec.execute {
            val v = work(app)
            onMain(Runnable { then(v) })
        }
    }

    /**
     * Run `work` on the engine thread and wait for it. For the reads the
     * platform asks for synchronously and nothing else: it holds the caller
     * for as long as whatever is already queued takes.
     */
    fun <T> sync(work: (App) -> T): T = exec.submit<T> { work(app) }.get()

    /** A frame is owed — the clock ticked, the view resized. */
    fun invalidate() {
        if (closed.get()) return
        exec.execute { requestFrameOnThread() }
    }

    fun close() {
        closed.set(true)
        exec.shutdown()
    }

    // On the engine thread.
    private fun requestFrameOnThread() {
        if (building) {
            wanted = true
            return
        }
        building = true
        // Not inline: the posts already queued behind this one run first, so
        // a press and the release that followed it are both in the frame.
        exec.execute { buildOnThread() }
    }

    private fun buildOnThread() {
        val f = build(app)
        onMain(Runnable { deliver(f) })
        building = false
        if (wanted) {
            wanted = false
            requestFrameOnThread()
        }
    }
}
