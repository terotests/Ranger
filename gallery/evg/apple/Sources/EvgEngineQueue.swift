// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The engine off the main thread — Apple.
//
// PLAN_NATIVE_HOSTS.md S1. A Ranger app compiled to Swift is a value: no
// UIKit in it, no view, nothing that has to be on the main actor. What has
// to be on the main actor is the view that receives touches and the context
// that paints. So the app lives on ONE serial queue, every call the host
// makes runs there in the order the host made it, and a call that changed
// the page produces a frame — laid out and listed on the queue — that is
// handed to the main thread, which paints it and nothing else.
//
// Three verbs, and the discipline is that a host uses them and never touches
// the app directly:
//
//   post { app in … }            run there; return true if a frame is owed
//   ask({ app in … }) { v in … } run there; answer on the main thread
//   sync { app in … }            run there and WAIT — for the one read UIKit
//                                insists on synchronously (`canBecomeFirstResponder`)
//
// Frames are coalesced: a burst of posts that each say "a frame is owed"
// produces one build after the last of them, and a build that is asked for
// while one is running produces exactly one more when it finishes — never a
// queue of stale frames the main thread has to draw through.
//
// `Frame` is whatever the host paints from: the display list alone, or the
// list with the viewport numbers the painter needs beside it, read on the
// queue so the main thread reads the app for nothing.

import Foundation

final class EvgEngineQueue<App, Frame> {

    private let queue = DispatchQueue(label: "fi.ranger.evg.engine", qos: .userInteractive)
    private let app: App
    private let build: (App) -> Frame
    private let deliver: (Frame) -> Void

    // Touched on the queue only.
    private var building = false
    private var wanted = false

    /// - Parameters:
    ///   - app: the Ranger app; make it BEFORE this, and never read it again
    ///     from the main thread
    ///   - build: the frame, run on the queue — `app.frame()` and whatever
    ///     the painter needs beside it
    ///   - deliver: called on the MAIN thread with each built frame; keep it
    ///     and `setNeedsDisplay`
    init(app: App, build: @escaping (App) -> Frame, deliver: @escaping (Frame) -> Void) {
        self.app = app
        self.build = build
        self.deliver = deliver
    }

    /// Run `work` on the engine queue. A `true` result asks for a frame.
    func post(_ work: @escaping (App) -> Bool) {
        queue.async { [self] in
            if work(app) { requestFrameOnQueue() }
        }
    }

    /// Run `work` on the engine queue and hand its answer to `then` on the
    /// main thread.
    func ask<T>(_ work: @escaping (App) -> T, then: @escaping (T) -> Void) {
        queue.async { [self] in
            let v = work(app)
            DispatchQueue.main.async { then(v) }
        }
    }

    /// Run `work` on the engine queue and wait for it. For the reads UIKit
    /// asks for synchronously and nothing else: it holds the caller for as
    /// long as whatever is already on the queue takes.
    func sync<T>(_ work: (App) -> T) -> T {
        return queue.sync { work(app) }
    }

    /// A frame is owed — the clock ticked, the window resized.
    func invalidate() {
        queue.async { [self] in requestFrameOnQueue() }
    }

    // On the queue.
    private func requestFrameOnQueue() {
        if building {
            wanted = true
            return
        }
        building = true
        // Not inline: the posts already queued behind this one run first, so
        // a press and the release that followed it are both in the frame.
        queue.async { [self] in buildOnQueue() }
    }

    private func buildOnQueue() {
        let f = build(app)
        DispatchQueue.main.async { [self] in deliver(f) }
        building = false
        if wanted {
            wanted = false
            requestFrameOnQueue()
        }
    }
}
