// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The one file in this port that cannot run without a device.
//
// Everything a RULE could be is in `ranger/rt_ios.rgr`: the contain fit, the
// safe area, the conversion from a window point to a page point, the pinch's
// focus, the pan's limits, what a press means. That is deliberate — a rule
// that lived in this file would be a rule nothing without a Mac can check, and
// `ranger/check_rt_ios.rgr` drives all of them on Node.
//
// What is left here is what only UIKit can do: unpacking a `UITouch`, running
// a display link, and turning a `CGContext` over to the painter.
//
// THE ENGINE IS NOT ON THIS THREAD. `app` is made here and then never touched
// from the main thread again: every call goes through `EvgEngineQueue`
// (gallery/evg/apple), which runs it on the engine's own serial queue, in
// order, and hands back a frame — the display list and the three viewport
// numbers the painter needs — when a call changed the page. `draw` paints the
// last frame it was given and reads the app for nothing, so a layout that
// takes twelve milliseconds blocks neither the touch nor the display link.
// (PLAN_NATIVE_HOSTS.md S1.)
//
// This is NOT `DashboardView`, and the difference is one line of drawing: the
// dashboard is a scrolling document and translates by its scroll offset, while
// this is a fixed 980x760 composition that is centred and letterboxed. Sharing
// one view between them would mean a protocol wide enough to describe both
// viewport models, which is a worse thing to maintain than two short views.
// What IS shared is the part worth sharing: `gallery/evg/apple` paints both.

import UIKit

/// What the painter needs, read on the engine queue beside the list so the
/// main thread reads the app for nothing.
struct RtFrame {
    let list: EVGDisplayList
    let offsetX: Double
    let offsetY: Double
    let scale: Double
    /// How long the layout and the list took, on the queue.
    let buildMs: Double
}

final class RealTrainerView: UIView {

    /// CoreText measures the page's text before anything is laid out: a
    /// stored property, declared above `app`, because Swift initialises
    /// them in order and the app makes its first layout when it is made.
    private let textMeasurer = CoreTextMeasurer.install()
    let app = RtIos()

    /// The engine queue. Every call to `app` below goes through it.
    private lazy var engine = EvgEngineQueue<RtIos, RtFrame>(
        app: app,
        build: { a in
            let t0 = CACurrentMediaTime()
            let list = a.frame()
            return RtFrame(
                list: list, offsetX: a.offsetX(), offsetY: a.offsetY(), scale: a.scale(),
                buildMs: (CACurrentMediaTime() - t0) * 1000.0
            )
        },
        deliver: { [weak self] f in self?.frameArrived(f) }
    )

    /// The last frame the engine handed over. `draw` paints this and only this.
    private var frame: RtFrame?

    /// The clock. This app is never idle by design — the loading screen's ring
    /// turns, the session's dial counts down, and a hover fades over 160ms — so
    /// the link runs continuously and the app is asked, every frame, whether
    /// anything moved.
    private var link: CADisplayLink?
    private var lastFrameTime: CFTimeInterval = 0

    private var started = false

    // MARK: - lifecycle

    override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        // The letterbox. The page is contained rather than cropped, so on a
        // window whose aspect differs from 980x760 there is real estate beside
        // it; it is the app's own background rather than white, so the page
        // does not sit in a bright frame.
        backgroundColor = UIColor(red: 0.06, green: 0.07, blue: 0.09, alpha: 1.0)
        isMultipleTouchEnabled = true
        isUserInteractionEnabled = true
        contentMode = .redraw

        // Nothing here consumes a touch: the recognisers let the press through
        // so the page still learns a finger landed. A host that let a
        // recogniser swallow `touchesBegan` has eaten the press — the page
        // never responds, while it still renders perfectly.
        let pan = UIPanGestureRecognizer(target: self, action: #selector(onPan(_:)))
        pan.cancelsTouchesInView = false
        pan.delaysTouchesBegan = false
        pan.delaysTouchesEnded = false
        addGestureRecognizer(pan)

        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(onPinch(_:)))
        pinch.cancelsTouchesInView = false
        pinch.delaysTouchesBegan = false
        pinch.delaysTouchesEnded = false
        addGestureRecognizer(pinch)

        let doubleTap = UITapGestureRecognizer(target: self, action: #selector(onDoubleTap(_:)))
        doubleTap.numberOfTapsRequired = 2
        doubleTap.cancelsTouchesInView = false
        // `delaysTouchesEnded` defaults to TRUE, and on a two-tap recogniser
        // that means every SINGLE tap has its `touchesEnded` held back for the
        // whole double-tap interval — roughly 300ms — while UIKit waits to see
        // whether a second tap arrives. The page cannot respond to a press it
        // has not been told about, so every button on the app answered about a
        // third of a second late, by the clock, no matter how fast the frame
        // was. It reads exactly like a slow renderer and is not one.
        //
        // The double tap still works: it fires on its own when it recognises.
        // Giving up the delay only means the single tap is no longer punished
        // for its existence.
        doubleTap.delaysTouchesEnded = false
        addGestureRecognizer(doubleTap)

        // A pointer that is not pressing: an iPad trackpad, or the Simulator's
        // mouse. Harmless on a touch-only device, where it simply never fires.
        let hover = UIHoverGestureRecognizer(target: self, action: #selector(onHover(_:)))
        addGestureRecognizer(hover)
    }

    /// The demo's own `realtrainer.css`, out of the bundle — the same file the
    /// browser page styles the same tree from.
    func start(css: String, compact: String, plan: String, chat: String, seed: String) {
        if started { return }
        let w = Double(bounds.width), h = Double(bounds.height)
        let i = safeAreaInsets
        engine.post { a in
            a.start(w: w, h: h, css: css, compact: compact, planMachine: plan, chatMachine: chat, seed: seed)
            a.setSafeArea(top: Double(i.top), bottom: Double(i.bottom), left: Double(i.left), right: Double(i.right))
            return true
        }
        started = true
        startClock()
    }

    deinit {
        link?.invalidate()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard started else { return }
        let w = Double(bounds.width), h = Double(bounds.height)
        let i = safeAreaInsets
        engine.post { a in
            a.resize(w: w, h: h)
            a.setSafeArea(top: Double(i.top), bottom: Double(i.bottom), left: Double(i.left), right: Double(i.right))
            return true
        }
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        guard started else { return }
        let i = safeAreaInsets
        engine.post { a in
            a.setSafeArea(top: Double(i.top), bottom: Double(i.bottom), left: Double(i.left), right: Double(i.right))
            return true
        }
    }

    /// A frame came off the engine queue: keep it, and draw.
    private func frameArrived(_ f: RtFrame) {
        frame = f
        setNeedsDisplay()
        if profiling { profile(f) }
    }

    // MARK: - the clock

    private func startClock() {
        guard link == nil else { return }
        lastFrameTime = CACurrentMediaTime()
        let l = CADisplayLink(target: self, selector: #selector(step))
        l.add(to: .main, forMode: .common)
        link = l
    }

    @objc private func step() {
        let now = CACurrentMediaTime()
        var dt = now - lastFrameTime
        lastFrameTime = now
        // A frame that arrived late must still advance time rather than be
        // skipped, and must not advance it by a second — a backgrounded app
        // coming forward would otherwise finish the whole loading animation in
        // one step.
        if dt <= 0 { dt = 1.0 / 60.0 }
        if dt > 0.064 { dt = 0.064 }
        let ms = dt * 1000.0
        engine.post { a in a.tick(dtMs: ms) }
    }

    // MARK: - drawing

    /// Frame timings, on the device, when asked for. Set RANGER_PROFILE in the
    /// launched process's environment and every 60 frames the host reports
    /// where the time went — laying the page out and building the display
    /// list, on the engine queue, against turning that list into pixels, on
    /// this thread. Guessing which of the two is slow from the outside is how
    /// an afternoon disappears.
    ///
    ///     npm run rt:ios:run -- --console          # simulator, output here
    ///     SIMCTL_CHILD_RANGER_PROFILE=1 npm run rt:ios:run -- --console
    private let profiling = ProcessInfo.processInfo.environment["RANGER_PROFILE"] != nil
    private var profFrames = 0
    private var profBuild: Double = 0
    private var profPaint: Double = 0

    private func profile(_ f: RtFrame) {
        profBuild += f.buildMs
    }

    override func draw(_ rect: CGRect) {
        guard started, let f = frame, let ctx = UIGraphicsGetCurrentContext() else { return }

        let t1 = profiling ? CACurrentMediaTime() : 0

        ctx.saveGState()
        // The two transforms the facade's arithmetic assumes, in the order it
        // assumes them: to the page's corner — which already has the safe area
        // and the letterbox in it — and then the scale. `toPageX` is the exact
        // inverse, and the two have to agree or a finger lands somewhere the
        // page is not. Both numbers came with the frame, read on the queue.
        ctx.translateBy(x: CGFloat(f.offsetX), y: CGFloat(f.offsetY))
        let scale = CGFloat(f.scale)
        ctx.scaleBy(x: scale, y: scale)
        // The list is NOT rasterised at a fixed size: the context is scaled and
        // the numbers are left alone, so text and vector shapes are drawn
        // *through* the scale rather than blown up from a bitmap made at some
        // other size. That is why a pinch stays sharp.
        EvgPainter.paint(f.list, into: CoreGraphicsEvgSurface(context: ctx))
        ctx.restoreGState()

        if profiling {
            let t2 = CACurrentMediaTime()
            profPaint += (t2 - t1) * 1000.0
            profFrames += 1
            if profFrames == 60 {
                let build = profBuild / 60.0
                let paint = profPaint / 60.0
                NSLog(String(
                    format: "ranger: layout+list %.2f ms/frame (engine queue), paint %.2f ms/frame (main), %d commands",
                    build, paint, f.list.cmds.count
                ))
                profFrames = 0
                profBuild = 0
                profPaint = 0
            }
        }
    }

    // MARK: - touches

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        guard started, let t = touches.first else { return }
        let p = t.location(in: self)
        let x = Double(p.x), y = Double(p.y)
        engine.post { a in a.pressAt(x: x, y: y) }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        guard started else { return }
        engine.post { a in a.releasePress() }
        syncKeyboard()
    }

    /// The keyboard follows the focus: a tap on a field takes it and the
    /// keyboard rises; a tap anywhere else drops it and the keyboard goes.
    /// Asked after the release above, on the queue, so the answer is the
    /// focus the release left.
    private func syncKeyboard() {
        engine.ask({ a in a.focusedField() }) { [weak self] field in
            guard let self = self else { return }
            if field.isEmpty {
                if self.isFirstResponder { self.resignFirstResponder() }
            } else if !self.isFirstResponder {
                self.becomeFirstResponder()
            }
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        guard started else { return }
        engine.post { a in a.cancelPress() }
    }

    // MARK: - gestures

    @objc private func onPan(_ g: UIPanGestureRecognizer) {
        guard started else { return }
        switch g.state {
        case .changed:
            let d = g.translation(in: self)
            g.setTranslation(.zero, in: self)
            let dx = Double(d.x), dy = Double(d.y)
            engine.post { a in a.canPan() && a.panBy(dx: dx, dy: dy) }
        default:
            break
        }
    }

    @objc private func onPinch(_ g: UIPinchGestureRecognizer) {
        guard started, g.state == .changed else {
            g.scale = 1.0
            return
        }
        let focus = g.location(in: self)
        // The factor is RELATIVE — what the fingers did since the last report —
        // because that is what the facade's pinch takes, and it is what keeps
        // the point under the fingers still.
        let factor = Double(g.scale), fx = Double(focus.x), fy = Double(focus.y)
        engine.post { a in a.pinch(factor: factor, focusX: fx, focusY: fy) }
        g.scale = 1.0
    }

    @objc private func onDoubleTap(_ g: UITapGestureRecognizer) {
        guard started else { return }
        engine.post { a in a.resetZoom() }
    }

    // MARK: - hover

    @objc private func onHover(_ g: UIHoverGestureRecognizer) {
        guard started else { return }
        switch g.state {
        case .began, .changed:
            let p = g.location(in: self)
            let x = Double(p.x), y = Double(p.y)
            engine.post { a in a.hoverAt(x: x, y: y) }
        default:
            engine.post { a in a.clearHover() }
        }
    }
}

// MARK: - The keyboard

/// What the keyboard types goes to the focused field, as the browser's
/// text-input bridge sends it: the text as typed, a Backspace as the key it
/// is. The page draws its own field and its own caret.
extension RealTrainerView: UIKeyInput {
    /// The one read UIKit wants an answer to on the spot, so it waits for the
    /// queue: whether a field has the focus.
    override var canBecomeFirstResponder: Bool {
        started && engine.sync { a in !a.focusedField().isEmpty }
    }

    var hasText: Bool { true }

    func insertText(_ text: String) {
        if text == "\n" {
            engine.post { a in a.key(name: "Enter", shift: false, ctrl: false) }
            return
        }
        engine.post { a in a.typeText(text: text) }
    }

    func deleteBackward() {
        engine.post { a in a.key(name: "Backspace", shift: false, ctrl: false) }
    }
}
