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
// This is NOT `DashboardView`, and the difference is one line of drawing: the
// dashboard is a scrolling document and translates by its scroll offset, while
// this is a fixed 980x760 composition that is centred and letterboxed. Sharing
// one view between them would mean a protocol wide enough to describe both
// viewport models, which is a worse thing to maintain than two short views.
// What IS shared is the part worth sharing: `gallery/evg/apple` paints both.

import UIKit

final class RealTrainerView: UIView {

    /// CoreText measures the page's text before anything is laid out: a
    /// stored property, declared above `app`, because Swift initialises
    /// them in order and the app makes its first layout when it is made.
    private let textMeasurer = CoreTextMeasurer.install()
    let app = RtIos()

    /// The frame, cached. `RtIos.frame()` lays the page out and builds the
    /// display list, which is the right cost for a page that changed and the
    /// wrong one for a redraw that changed nothing.
    private var cachedFrame: EVGDisplayList?

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
        app.start(
            w: Double(bounds.width), h: Double(bounds.height),
            css: css, compact: compact, planMachine: plan, chatMachine: chat, seed: seed
        )
        applySafeArea()
        started = true
        startClock()
        invalidate()
    }

    deinit {
        link?.invalidate()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard started else { return }
        app.resize(w: Double(bounds.width), h: Double(bounds.height))
        applySafeArea()
        invalidate()
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        guard started else { return }
        applySafeArea()
        invalidate()
    }

    private func applySafeArea() {
        let i = safeAreaInsets
        app.setSafeArea(
            top: Double(i.top),
            bottom: Double(i.bottom),
            left: Double(i.left),
            right: Double(i.right)
        )
    }

    /// The page changed, so the cached frame is a frame of a page that no
    /// longer exists.
    func invalidate() {
        cachedFrame = nil
        setNeedsDisplay()
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
        if app.tick(dtMs: dt * 1000.0) {
            invalidate()
        }
    }

    // MARK: - drawing

    /// Frame timings, on the device, when asked for. Set RANGER_PROFILE in the
    /// launched process's environment and every 60 painted frames the host
    /// reports where the time went — laying the page out and building the
    /// display list, against turning that list into pixels. Guessing which of
    /// the two is slow from the outside is how an afternoon disappears.
    ///
    ///     npm run rt:ios:run -- --console          # simulator, output here
    ///     SIMCTL_CHILD_RANGER_PROFILE=1 npm run rt:ios:run -- --console
    private let profiling = ProcessInfo.processInfo.environment["RANGER_PROFILE"] != nil
    private var profFrames = 0
    private var profBuild: CFTimeInterval = 0
    private var profPaint: CFTimeInterval = 0

    override func draw(_ rect: CGRect) {
        guard started, let ctx = UIGraphicsGetCurrentContext() else { return }

        let t0 = profiling ? CACurrentMediaTime() : 0
        let list: EVGDisplayList
        if let cached = cachedFrame {
            list = cached
        } else {
            list = app.frame()
            cachedFrame = list
        }
        let t1 = profiling ? CACurrentMediaTime() : 0

        ctx.saveGState()
        // The two transforms the facade's arithmetic assumes, in the order it
        // assumes them: to the page's corner — which already has the safe area
        // and the letterbox in it — and then the scale. `toPageX` is the exact
        // inverse, and the two have to agree or a finger lands somewhere the
        // page is not.
        ctx.translateBy(x: CGFloat(app.offsetX()), y: CGFloat(app.offsetY()))
        let scale = CGFloat(app.scale())
        ctx.scaleBy(x: scale, y: scale)
        // The list is NOT rasterised at a fixed size: the context is scaled and
        // the numbers are left alone, so text and vector shapes are drawn
        // *through* the scale rather than blown up from a bitmap made at some
        // other size. That is why a pinch stays sharp.
        EvgPainter.paint(list, into: CoreGraphicsEvgSurface(context: ctx))
        ctx.restoreGState()

        if profiling {
            let t2 = CACurrentMediaTime()
            profBuild += t1 - t0
            profPaint += t2 - t1
            profFrames += 1
            if profFrames == 60 {
                let build = profBuild * 1000.0 / 60.0
                let paint = profPaint * 1000.0 / 60.0
                NSLog(String(
                    format: "ranger: %.2f ms/frame — layout+list %.2f, paint %.2f, %d commands",
                    build + paint, build, paint, list.cmds.count
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
        if app.pressAt(x: Double(p.x), y: Double(p.y)) {
            invalidate()
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        guard started else { return }
        if app.releasePress() {
            invalidate()
        }
        syncKeyboard()
    }

    /// The keyboard follows the focus: a tap on a field takes it and the
    /// keyboard rises; a tap anywhere else drops it and the keyboard goes.
    private func syncKeyboard() {
        if app.focusedField().isEmpty {
            if isFirstResponder { resignFirstResponder() }
        } else if !isFirstResponder {
            becomeFirstResponder()
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        guard started else { return }
        if app.cancelPress() {
            invalidate()
        }
    }

    // MARK: - gestures

    @objc private func onPan(_ g: UIPanGestureRecognizer) {
        guard started, app.canPan() else { return }
        switch g.state {
        case .changed:
            let d = g.translation(in: self)
            g.setTranslation(.zero, in: self)
            if app.panBy(dx: Double(d.x), dy: Double(d.y)) {
                invalidate()
            }
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
        if app.pinch(factor: Double(g.scale), focusX: Double(focus.x), focusY: Double(focus.y)) {
            invalidate()
        }
        g.scale = 1.0
    }

    @objc private func onDoubleTap(_ g: UITapGestureRecognizer) {
        guard started else { return }
        if app.resetZoom() {
            invalidate()
        }
    }

    // MARK: - hover

    @objc private func onHover(_ g: UIHoverGestureRecognizer) {
        guard started else { return }
        switch g.state {
        case .began, .changed:
            let p = g.location(in: self)
            if app.hoverAt(x: Double(p.x), y: Double(p.y)) {
                invalidate()
            }
        default:
            if app.clearHover() {
                invalidate()
            }
        }
    }
}

// MARK: - The keyboard

/// What the keyboard types goes to the focused field, as the browser's
/// text-input bridge sends it: the text as typed, a Backspace as the key it
/// is. The page draws its own field and its own caret.
extension RealTrainerView: UIKeyInput {
    override var canBecomeFirstResponder: Bool { started && !app.focusedField().isEmpty }

    var hasText: Bool { true }

    func insertText(_ text: String) {
        if text == "\n" {
            if app.key(name: "Enter", shift: false, ctrl: false) { invalidate() }
            return
        }
        if app.typeText(text: text) { invalidate() }
    }

    func deleteBackward() {
        if app.key(name: "Backspace", shift: false, ctrl: false) { invalidate() }
    }
}
