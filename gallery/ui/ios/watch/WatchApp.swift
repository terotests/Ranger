// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The same dashboard, on a 45mm screen.
//
// A standalone watchOS app — no paired iPhone app to be an appendage of, which
// is what watchOS 6 and later allow and what makes a watch build from the
// command line reasonable at all.
//
// The interesting question a watch asks this port is not "does SwiftUI work".
// It is: what does a 1336-pixel-wide document mean on a screen 198 points
// across? Fitting the width gives a scale of 0.148, which is a photograph of a
// dashboard rather than a dashboard. So the watch uses the facade's READABLE
// FIT — a floor on the scale, and the reader moves around the page — and that
// decision, along with the crown's units, lives in `ranger/ui_ios.rgr` where
// `check_ios.rgr` drives it without a watch.
//
// Everything drawn here goes through the same `EvgPainter` and the same
// `CoreGraphicsEvgSurface` the iPhone uses. SwiftUI's `Canvas` hands out a
// `CGContext` exactly as a `UIView` does, so the watch needs no backend of its
// own.

import SwiftUI
import CoreGraphics

@main
struct RangerWatchApp: App {
    var body: some Scene {
        WindowGroup {
            DashboardWatchView()
        }
    }
}

final class WatchPageModel: ObservableObject {

    let app = UiIos()

    /// Bumped whenever the page changed, which is what makes the `Canvas`
    /// redraw. The display list itself is cached: laying the page out runs the
    /// Vela runtime for the chart, and a crown turn must not pay for that.
    @Published var generation: Int = 0

    private var started = false
    private var cached: EVGDisplayList?
    private var lastCrown: Double = 0

    func start(size: CGSize, css: String) {
        guard !started else {
            resize(size: size)
            return
        }
        // The floor, before start, because `start` fits the page.
        app.useWatchFit(minScale: 0.5)
        app.start(w: Double(size.width), h: Double(size.height), css: css)
        started = true
        invalidate()
    }

    func resize(size: CGSize) {
        guard started else { return }
        app.resize(w: Double(size.width), h: Double(size.height))
        invalidate()
    }

    func invalidate() {
        cached = nil
        generation += 1
    }

    /// The crown reports a rotation, not a distance on a screen, so it does
    /// NOT go through the scale the way a finger does — one turn is the same
    /// amount of page on a 40mm watch and a 49mm one. The facade owns that
    /// conversion; this only turns an absolute crown value into a delta.
    func crownChanged(to value: Double) {
        guard started else { return }
        let delta = value - lastCrown
        lastCrown = value
        if delta == 0 { return }
        if app.scrollByCrown(turns: delta) {
            invalidate()
        }
    }

    /// A drag on a watch is sideways panning: the crown already owns the
    /// vertical, and giving a finger the same axis makes both feel unreliable.
    func drag(dx: CGFloat, dy: CGFloat) {
        guard started else { return }
        var moved = false
        if abs(dx) > 0 {
            moved = app.panBy(dx: Double(dx)) || moved
        }
        if abs(dy) > 0 {
            moved = app.scrollByScreen(dy: Double(-dy)) || moved
        }
        if moved { invalidate() }
    }

    func tap(at p: CGPoint) {
        guard started else { return }
        _ = app.pressAt(x: Double(p.x), y: Double(p.y))
        _ = app.releasePress()
        invalidate()
    }

    func paint(into ctx: CGContext) {
        guard started else { return }
        let list: EVGDisplayList
        if let c = cached {
            list = c
        } else {
            list = app.frame()
            cached = list
        }
        let scale = CGFloat(app.scale())
        ctx.saveGState()
        // No safe area here: a watch app is full bleed, and the facade's
        // insets stay at zero.
        ctx.scaleBy(x: scale, y: scale)
        ctx.translateBy(x: -CGFloat(app.panX()), y: 0)
        EvgPainter.paint(list, into: CoreGraphicsEvgSurface(context: ctx))
        ctx.restoreGState()
    }

    /// The demo's own stylesheet, out of the bundle — the same file the
    /// browser page and the gates style the tree from.
    static func loadStylesheet() -> String {
        guard let url = Bundle.main.url(forResource: "dashboard", withExtension: "css"),
              let text = try? String(contentsOf: url, encoding: .utf8)
        else {
            return ""
        }
        return text
    }
}

struct DashboardWatchView: View {

    @StateObject private var model = WatchPageModel()
    @State private var crown: Double = 0
    /// `DragGesture.translation` is cumulative from where the finger landed,
    /// and the facade takes a DELTA. Keeping the last translation is the whole
    /// of the difference between a page that follows the finger and one that
    /// accelerates away from it.
    @State private var lastDrag: CGSize = .zero

    var body: some View {
        // What makes this redraw is the @StateObject: any `@Published` change
        // fires `objectWillChange` and the body is evaluated again, which
        // produces a new `Canvas` and a new draw. `generation` is read HERE,
        // in the body, rather than inside the renderer closure — the closure
        // runs after body evaluation, so a dependency taken there would be
        // taken too late to be one.
        let generation = model.generation
        return GeometryReader { geo in
            Canvas { context, _ in
                _ = generation
                context.withCGContext { cg in
                    model.paint(into: cg)
                }
            }
            .gesture(
                DragGesture(minimumDistance: 4)
                    .onChanged { value in
                        let dx = value.translation.width - lastDrag.width
                        let dy = value.translation.height - lastDrag.height
                        lastDrag = value.translation
                        model.drag(dx: dx, dy: dy)
                    }
                    .onEnded { _ in
                        lastDrag = .zero
                    }
            )
            .onTapGesture(count: 1, coordinateSpace: .local) { location in
                model.tap(at: location)
            }
            .focusable()
            .digitalCrownRotation(
                $crown,
                from: -1000.0,
                through: 1000.0,
                by: 0.02,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )
            .onChange(of: crown) { value in
                model.crownChanged(to: value)
            }
            .onAppear {
                model.start(size: geo.size, css: WatchPageModel.loadStylesheet())
            }
            .onChange(of: geo.size) { size in
                model.resize(size: size)
            }
        }
        .ignoresSafeArea()
    }
}
