// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The one file here that cannot run without a device.
//
// Everything a rule could be is in `ranger/ui_ios.rgr`: the fit scale, the safe
// area, the conversion from a window point to a page point, the pinch's focus
// point, the pan's limits, the scroll clamp. That is deliberate — a rule that
// lived in this file would be a rule nothing without a Mac can check, and
// `ranger/check_ios.rgr` drives all of them on Node.
//
// What is left here is what only UIKit can do: unpacking a `UITouch`, running
// a fling that decays, and turning a `CGContext` over to the painter.
//
// One thing worth naming, because almost every UIKit example gets it wrong for
// this kind of view: NOTHING HERE CONSUMES A TOUCH. The pan and pinch
// recognisers have `cancelsTouchesInView = false`, so the page still sees the
// finger land. A host that let a recogniser swallow `touchesBegan` has eaten
// the press — the page never learns a finger arrived, so nothing responds while
// it still renders perfectly.

import UIKit

final class DashboardView: UIView {

    /// CoreText measures the page's text before anything is laid out: a
    /// stored property, declared above `app`, because Swift initialises
    /// them in order and the app makes its first layout when it is made.
    private let textMeasurer = CoreTextMeasurer.install()
    let app = UiIos()

    /// The frame, cached. `UiIos.frame()` lays the page out and runs the Vela
    /// runtime for the chart, which is the right cost for a page that changed
    /// and the wrong one for a scroll that is redrawing sixty times a second.
    private var cachedFrame: EVGDisplayList?

    /// The fling. `UIScrollView` is not in the middle of this — the page has
    /// its own scroll container, in page pixels, and wrapping it in a scroll
    /// view would give the reader two of them.
    private var flingVelocity: CGFloat = 0
    private var flingLink: CADisplayLink?
    private var lastFlingTime: CFTimeInterval = 0

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
        backgroundColor = .white
        isMultipleTouchEnabled = true
        isUserInteractionEnabled = true
        contentMode = .redraw

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
    }

    /// The stylesheet is the demo's own `dashboard.css`, copied into the bundle
    /// by the build. Not a copy of it that drifts — the file the browser page
    /// and the gates style the same tree from.
    func start(css: String) {
        if started { return }
        app.start(w: Double(bounds.width), h: Double(bounds.height), css: css)
        applySafeArea()
        started = true
        invalidate()
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

    /// A notch, a status bar, a home indicator, a keyboard. The page is laid
    /// into what is left of the window, which is why nothing on it ends up
    /// under the clock.
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

    // MARK: - drawing

    override func draw(_ rect: CGRect) {
        guard started, let ctx = UIGraphicsGetCurrentContext() else { return }

        let list: EVGDisplayList
        if let cached = cachedFrame {
            list = cached
        } else {
            list = app.frame()
            cachedFrame = list
        }

        let scale = CGFloat(app.scale())
        ctx.saveGState()
        // The three transforms the facade's own arithmetic assumes, in the
        // order it assumes them: into the safe area, then the fit scale, then
        // the pan. `toPageX` is the inverse of exactly this, and the two have
        // to agree or a finger lands somewhere the page is not.
        ctx.translateBy(x: safeAreaInsets.left, y: safeAreaInsets.top)
        ctx.scaleBy(x: scale, y: scale)
        ctx.translateBy(x: -CGFloat(app.panX()), y: 0)
        // The display list is NOT rasterised at a fixed size: the context is
        // scaled and the numbers are left alone, so text and vector shapes are
        // drawn *through* the scale rather than blown up from a bitmap made at
        // some other size. That is why a pinch stays sharp.
        EvgPainter.paint(list, into: CoreGraphicsEvgSurface(context: ctx))
        ctx.restoreGState()
    }

    // MARK: - touches

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        stopFling()
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
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        guard started else { return }
        if app.releasePress() {
            invalidate()
        }
    }

    // MARK: - gestures

    @objc private func onPan(_ g: UIPanGestureRecognizer) {
        guard started else { return }
        switch g.state {
        case .began:
            stopFling()
        case .changed:
            let d = g.translation(in: self)
            g.setTranslation(.zero, in: self)
            var moved = false
            // Sideways only moves the page when there is page to move to,
            // which at rest there is not: the whole width fits.
            if abs(d.x) > 0, app.maxPanX() > 0 {
                moved = app.panBy(dx: Double(d.x)) || moved
            }
            if abs(d.y) > 0 {
                moved = app.scrollByScreen(dy: Double(-d.y)) || moved
            }
            if moved { invalidate() }
        case .ended, .cancelled:
            let v = g.velocity(in: self)
            if abs(v.y) > 120 {
                startFling(velocity: -v.y)
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
        // The factor is RELATIVE — what the fingers did since the last report
        // — because that is what the facade's pinch takes, and it is what
        // keeps the point under the fingers still.
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

    // MARK: - the fling

    private func startFling(velocity: CGFloat) {
        stopFling()
        flingVelocity = velocity
        lastFlingTime = CACurrentMediaTime()
        let link = CADisplayLink(target: self, selector: #selector(stepFling))
        link.add(to: .main, forMode: .common)
        flingLink = link
    }

    private func stopFling() {
        flingLink?.invalidate()
        flingLink = nil
        flingVelocity = 0
    }

    @objc private func stepFling() {
        let now = CACurrentMediaTime()
        var dt = now - lastFlingTime
        lastFlingTime = now
        // A frame that arrived late must still advance time rather than be
        // skipped, and must not advance it by a second: the same clamp the
        // facade applies to its own clock, for the same reason.
        if dt <= 0 { dt = 1.0 / 60.0 }
        if dt > 0.064 { dt = 0.064 }

        let moved = app.scrollByScreen(dy: Double(flingVelocity * CGFloat(dt)))
        // Roughly a 2% decay per millisecond, which is what a finger flicking
        // a long page feels like.
        flingVelocity *= CGFloat(pow(0.998, dt * 1000.0))
        if !moved || abs(flingVelocity) < 20 {
            stopFling()
            return
        }
        invalidate()
    }

    // MARK: - the keyboard

    /// An iPad with a Magic Keyboard, or a Bluetooth keyboard on a phone.
    /// Everything a key MEANS is the demo's; the host only has to name the keys
    /// the way the browser does. A typo in this table is silent — the page
    /// simply ignores the keyboard, which looks exactly like a page with no
    /// keyboard support — so `check_ios.rgr` asserts the names the demo answers
    /// to.
    override var canBecomeFirstResponder: Bool { true }

    override var keyCommands: [UIKeyCommand]? {
        [
            UIKeyCommand(input: UIKeyCommand.inputUpArrow, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: UIKeyCommand.inputDownArrow, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: UIKeyCommand.inputPageUp, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: UIKeyCommand.inputPageDown, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: UIKeyCommand.inputHome, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: UIKeyCommand.inputEnd, modifierFlags: [], action: #selector(onKey(_:))),
            UIKeyCommand(input: " ", modifierFlags: [], action: #selector(onKey(_:))),
        ]
    }

    @objc private func onKey(_ command: UIKeyCommand) {
        guard started, let input = command.input else { return }
        let name: String
        switch input {
        case UIKeyCommand.inputUpArrow: name = "ArrowUp"
        case UIKeyCommand.inputDownArrow: name = "ArrowDown"
        case UIKeyCommand.inputPageUp: name = "PageUp"
        case UIKeyCommand.inputPageDown: name = "PageDown"
        case UIKeyCommand.inputHome: name = "Home"
        case UIKeyCommand.inputEnd: name = "End"
        case " ": name = "PageDown"
        default: return
        }
        if app.key(name: name) {
            invalidate()
        }
    }
}
