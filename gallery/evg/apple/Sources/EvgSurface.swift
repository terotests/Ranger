// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Everything a backend has to be able to draw, and nothing else.
//
// `EVGDisplayList` is eight command kinds of absolute pixels and resolved
// colours — no tree, no units, no fonts to resolve. That is small enough that a
// backend is a page of delegation rather than a renderer, which is the point:
// `CoreGraphicsEvgSurface` paints with a `CGContext` (so a `UIView` on iOS and
// a SwiftUI `Canvas` on watchOS share one implementation), `RecordingSurface`
// counts what was dispatched without drawing anything, and the walk that
// decides what each command *means* — `EvgPainter` — is written once.
//
// This is the Apple sibling of `gallery/evg/android`, and the interface is
// deliberately the same one: a port that diverges here would make the two
// painters two programs to keep in step rather than one idea with two
// backends.
//
// Geometry is in the app's own points. A host that wants device pixels scales
// its context and leaves these numbers alone — text then rasterises at the
// panel's real resolution instead of being blown up from a bitmap made at some
// other size.

import CoreGraphics

/// A colour as the display list carries it: 0-255 channels and a 0-1 alpha.
public struct EvgColor {
    public let r: Int
    public let g: Int
    public let b: Int
    public let a: Double

    public init(r: Int, g: Int, b: Int, a: Double) {
        self.r = r
        self.g = g
        self.b = b
        self.a = a
    }

    private static func clamp255(_ v: Int) -> CGFloat {
        if v < 0 { return 0 }
        if v > 255 { return 1 }
        return CGFloat(v) / 255.0
    }

    public var cgColor: CGColor {
        let alpha = a < 0 ? 0 : (a > 1 ? 1 : a)
        return CGColor(
            srgbRed: EvgColor.clamp255(r),
            green: EvgColor.clamp255(g),
            blue: EvgColor.clamp255(b),
            alpha: CGFloat(alpha)
        )
    }

    /// The same colour with the alpha replaced, for a shadow that carries its
    /// own.
    public func withAlpha(_ alpha: Double) -> EvgColor {
        EvgColor(r: r, g: g, b: b, a: alpha)
    }
}

/// A two-stop linear gradient. `vertical` is EVG's `gradDir == 0`.
public struct EvgGradient {
    public let color1: EvgColor
    public let color2: EvgColor
    public let vertical: Bool

    public init(color1: EvgColor, color2: EvgColor, vertical: Bool) {
        self.color1 = color1
        self.color2 = color2
        self.vertical = vertical
    }
}

/// An outer drop shadow: offset, blur radius, colour.
public struct EvgShadow {
    public let dx: CGFloat
    public let dy: CGFloat
    public let blur: CGFloat
    public let color: EvgColor

    public init(dx: CGFloat, dy: CGFloat, blur: CGFloat, color: EvgColor) {
        self.dx = dx
        self.dy = dy
        self.blur = blur
        self.color = color
    }
}

public protocol EvgSurface: AnyObject {

    /// Push the clip/transform stack. Paired with `restore`.
    func save()

    /// Pop back to the state the matching `save` recorded.
    func restore()

    /// Intersect the clip with this rectangle. Only ever inside a `save`.
    func clipRect(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat)

    /// Turn the coordinate system `degrees` about (`px`, `py`).
    func rotate(degrees: CGFloat, px: CGFloat, py: CGFloat)

    /// A filled box, possibly rounded, possibly a two-stop gradient, possibly
    /// under a drop shadow. The shadow is painted first and is the shape's own
    /// silhouette — a rounded box casts a rounded shadow.
    func fillRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat,
        color: EvgColor,
        gradient: EvgGradient?,
        shadow: EvgShadow?
    )

    /// A stroked outline, drawn as a band of `thickness` INSIDE the box.
    func strokeRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat, thickness: CGFloat,
        color: EvgColor
    )

    /// A filled vector outline. The rings are already flattened and already in
    /// page coordinates; `ringEnds` gives the index in `pts` one past each
    /// ring's last coordinate, so a shape with a hole arrives as two rings.
    func fillPath(
        pts: [Double], ringEnds: [Int], evenOdd: Bool,
        color: EvgColor,
        shadow: EvgShadow?
    )

    /// The same rings, stroked rather than filled.
    func strokePath(
        pts: [Double], ringEnds: [Int],
        thickness: CGFloat,
        color: EvgColor
    )

    /// A picture, by the name the page gave it. A surface that has no bytes for
    /// `src` should draw the placeholder rather than nothing — a missing
    /// texture and a blank card look identical otherwise.
    func drawImage(
        src: String,
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat,
        flipH: Bool, flipV: Bool
    )

    /// One run, on one line, in one face.
    ///
    /// `top` is the top of the LINE BOX, not the baseline: EVG measured the run
    /// with its own width estimate and the baseline sits one face-ascent below.
    /// Placing the ink at `top` instead lifts every run by the empty space
    /// above its capitals — a couple of points on a caption, most of a line on
    /// a heading. The surface owns that conversion because only it knows what
    /// its own font metrics say.
    func drawTextRun(
        text: String,
        x: CGFloat, top: CGFloat,
        sizePx: CGFloat,
        family: String, bold: Bool, italic: Bool,
        color: EvgColor
    )
}
