// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A surface that draws nothing and counts everything.
//
// Wrap a real surface in one of these and the frame is painted exactly as it
// would be, with a tally of what was dispatched on the other side. "Some ink
// appeared" is a weak check — a painter that had quietly stopped drawing text
// would pass it — so a check asserts the counts instead: this page reaches
// text, filled boxes, borders, rounded corners, clipping, a filled path and
// stroked paths, and every `save` is matched by a `restore`.
//
// The Ranger side of this port counts the same things one step earlier, on the
// display list itself (`gallery/ui/ios/ranger/check_ios.rgr`), because that can
// run without a Mac. This is for the half that cannot: it says whether the
// PAINTER dispatched them, not merely whether the page produced them.

import CoreGraphics

public final class RecordingSurface: EvgSurface {

    public private(set) var calls: [String: Int] = [:]
    private let inner: EvgSurface?

    public init(wrapping inner: EvgSurface? = nil) {
        self.inner = inner
    }

    public func count(_ kind: String) -> Int {
        calls[kind] ?? 0
    }

    private func note(_ kind: String) {
        calls[kind, default: 0] += 1
    }

    public var summary: String {
        calls.keys.sorted().map { "\($0)=\(calls[$0]!)" }.joined(separator: "  ")
    }

    public func save() {
        note("save")
        inner?.save()
    }

    public func restore() {
        note("restore")
        inner?.restore()
    }

    public func clipRect(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat) {
        note("clipRect")
        inner?.clipRect(x: x, y: y, w: w, h: h)
    }

    public func rotate(degrees: CGFloat, px: CGFloat, py: CGFloat) {
        note("rotate")
        inner?.rotate(degrees: degrees, px: px, py: py)
    }

    public func fillRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat, color: EvgColor,
        gradient: EvgGradient?, shadow: EvgShadow?
    ) {
        note("fillRect")
        if radius > 0 { note("roundedRect") }
        if gradient != nil { note("gradient") }
        if shadow != nil { note("shadow") }
        inner?.fillRect(x: x, y: y, w: w, h: h, radius: radius, color: color, gradient: gradient, shadow: shadow)
    }

    public func strokeRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat, thickness: CGFloat, color: EvgColor
    ) {
        note("strokeRect")
        inner?.strokeRect(x: x, y: y, w: w, h: h, radius: radius, thickness: thickness, color: color)
    }

    public func fillPath(
        pts: [Double], ringEnds: [Int], evenOdd: Bool,
        color: EvgColor, shadow: EvgShadow?
    ) {
        note("fillPath")
        if shadow != nil { note("shadow") }
        inner?.fillPath(pts: pts, ringEnds: ringEnds, evenOdd: evenOdd, color: color, shadow: shadow)
    }

    public func strokePath(pts: [Double], ringEnds: [Int], thickness: CGFloat, color: EvgColor) {
        note("strokePath")
        inner?.strokePath(pts: pts, ringEnds: ringEnds, thickness: thickness, color: color)
    }

    public func drawImage(
        src: String, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat, flipH: Bool, flipV: Bool
    ) {
        note("drawImage")
        inner?.drawImage(src: src, x: x, y: y, w: w, h: h, radius: radius, flipH: flipH, flipV: flipV)
    }

    public func drawTextRun(
        text: String, x: CGFloat, top: CGFloat, sizePx: CGFloat,
        family: String, bold: Bool, italic: Bool, color: EvgColor
    ) {
        note("drawTextRun")
        if italic { note("italicText") }
        inner?.drawTextRun(text: text, x: x, top: top, sizePx: sizePx, family: family, bold: bold, italic: italic, color: color)
    }
}
