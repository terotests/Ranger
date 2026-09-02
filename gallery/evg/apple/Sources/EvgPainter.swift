// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The walk: an `EVGDisplayList` in, calls on an `EvgSurface` out.
//
// Android and Apple differ in how they fill a rounded box, not in what a
// command *means*, so what a command means is decided exactly once — here —
// and this file is a transliteration of `gallery/evg/android`'s `EvgPainter`
// rather than a second reading of the format. Where the two disagree, one of
// them is wrong.
//
// Two things this painter honours that a JSON-fed backend cannot:
//
//  * **Gradients and shadows.** `EVGDisplayList.toJson` carries neither, so a
//    browser host cannot draw them. Reading the objects directly — which is
//    what a Swift host can do — brings both back.
//  * **Clipping and multi-ring paths.** `save`/`clipRect`/`restore` and a real
//    even-odd fill are one line each on CoreGraphics.

import CoreGraphics

enum EvgPainter {

    private static let RECT = 0
    private static let BORDER = 1
    private static let IMAGE = 2
    private static let TEXT = 3
    private static let PUSH_CLIP = 4
    private static let POP_CLIP = 5
    private static let PATH = 6
    private static let STROKE = 7

    /// Anything below this is invisible; drawing it is work for nothing.
    private static let MIN_ALPHA = 0.001

    /// Paint every command in order. Answers how many were actually drawn,
    /// which is what a host puts in a debug overlay — a frame that draws 0 of
    /// 350 commands is a bug you want to see rather than a black screen.
    @discardableResult
    static func paint(_ list: EVGDisplayList, into surface: EvgSurface) -> Int {
        var drawn = 0
        // A list that pushes more clips than it pops must not leave the surface
        // with a clip nobody asked for, and one that pops more than it pushes
        // must not restore past the state the host handed us. The depth counter
        // is the whole of both guarantees.
        var clipDepth = 0
        let n = list.count()
        var i = 0
        while i < n {
            let c = list.at(i: i)
            i += 1

            if c.kind == PUSH_CLIP {
                surface.save()
                surface.clipRect(
                    x: CGFloat(c.x), y: CGFloat(c.y),
                    w: CGFloat(c.w), h: CGFloat(c.h)
                )
                clipDepth += 1
                continue
            }
            if c.kind == POP_CLIP {
                if clipDepth > 0 {
                    surface.restore()
                    clipDepth -= 1
                }
                continue
            }

            // A rotation turns the command about its own box centre, which is
            // what the PDF matrix and the GL shader both do. Wrapping it in
            // save/restore keeps the clip stack above untouched.
            let turned = c.rotate > 0.001 || c.rotate < -0.001
            if turned {
                surface.save()
                surface.rotate(
                    degrees: CGFloat(c.rotate),
                    px: CGFloat(c.x + c.w * 0.5),
                    py: CGFloat(c.y + c.h * 0.5)
                )
            }

            if drawOne(c, surface) { drawn += 1 }

            if turned { surface.restore() }
        }
        while clipDepth > 0 {
            surface.restore()
            clipDepth -= 1
        }
        return drawn
    }

    private static func drawOne(_ c: EVGDrawCmd, _ surface: EvgSurface) -> Bool {
        switch c.kind {
        case RECT:
            let shadow = shadowOf(c)
            let gradient = gradientOf(c)
            if c.a < MIN_ALPHA && gradient == nil && shadow == nil { return false }
            surface.fillRect(
                x: CGFloat(c.x), y: CGFloat(c.y), w: CGFloat(c.w), h: CGFloat(c.h),
                radius: CGFloat(c.radius),
                color: colorOf(c),
                gradient: gradient,
                shadow: shadow
            )
            return true

        case BORDER:
            if c.a < MIN_ALPHA { return false }
            // A border with no thickness is still a border: the display list
            // leaves the default at 0 for a hairline, and a stroke of width 0
            // is invisible.
            let t = c.thickness > 0.0 ? CGFloat(c.thickness) : 1.0
            surface.strokeRect(
                x: CGFloat(c.x), y: CGFloat(c.y), w: CGFloat(c.w), h: CGFloat(c.h),
                radius: CGFloat(c.radius), thickness: t,
                color: colorOf(c)
            )
            return true

        case IMAGE:
            if c.src.isEmpty { return false }
            surface.drawImage(
                src: c.src,
                x: CGFloat(c.x), y: CGFloat(c.y), w: CGFloat(c.w), h: CGFloat(c.h),
                radius: CGFloat(c.radius),
                flipH: c.flipH, flipV: c.flipV
            )
            return true

        case TEXT:
            if c.text.isEmpty { return false }
            if c.a < MIN_ALPHA { return false }
            surface.drawTextRun(
                text: c.text,
                x: CGFloat(c.x), top: CGFloat(c.y),
                sizePx: CGFloat(c.fontSize),
                family: c.fontFamily,
                bold: isBold(c.fontWeight),
                // `addText` has nowhere else to record a slanted face, so it
                // writes "italic" into textAlign and `toJson` reads it back out
                // the same way. Not lovely, but it is the format.
                italic: c.textAlign == "italic",
                color: colorOf(c)
            )
            return true

        case PATH:
            if c.a < MIN_ALPHA { return false }
            if c.pts.count < 6 { return false }
            surface.fillPath(
                pts: c.pts, ringEnds: ringsOf(c), evenOdd: c.evenOdd,
                color: colorOf(c), shadow: shadowOf(c)
            )
            return true

        case STROKE:
            if c.a < MIN_ALPHA { return false }
            if c.pts.count < 4 { return false }
            let t = c.thickness > 0.0 ? CGFloat(c.thickness) : 1.0
            surface.strokePath(
                pts: c.pts, ringEnds: ringsOf(c), thickness: t, color: colorOf(c)
            )
            return true

        default:
            return false
        }
    }

    /// A path emitted by the SVG walk carries its ring boundaries; one emitted
    /// by `addPolygon` / `addPolyline` may not. A single implicit ring covering
    /// every point is the right reading of an empty `ringEnds` — it is what the
    /// polygon filler assumes.
    private static func ringsOf(_ c: EVGDrawCmd) -> [Int] {
        c.ringEnds.isEmpty ? [c.pts.count] : c.ringEnds
    }

    private static func gradientOf(_ c: EVGDrawCmd) -> EvgGradient? {
        if !c.hasGrad { return nil }
        return EvgGradient(
            color1: EvgColor(r: c.r, g: c.g, b: c.b, a: c.a),
            color2: EvgColor(r: c.r2, g: c.g2, b: c.b2, a: c.a2),
            // dir 0 = vertical (top to bottom), 1 = horizontal (left to right)
            vertical: c.gradDir != 1
        )
    }

    private static func shadowOf(_ c: EVGDrawCmd) -> EvgShadow? {
        if !c.hasShadow { return nil }
        if c.shadowA < MIN_ALPHA { return nil }
        return EvgShadow(
            dx: CGFloat(c.shadowX),
            dy: CGFloat(c.shadowY),
            blur: CGFloat(c.shadowBlur),
            color: EvgColor(r: c.shadowR, g: c.shadowG, b: c.shadowB, a: c.shadowA)
        )
    }

    private static func colorOf(_ c: EVGDrawCmd) -> EvgColor {
        EvgColor(r: c.r, g: c.g, b: c.b, a: c.a)
    }

    /// The display list writes the word, not the number — `addText` only ever
    /// says "bold" — but a stylesheet path could put a CSS weight here, so a
    /// number is read as one.
    static func isBold(_ weight: String) -> Bool {
        if weight.isEmpty { return false }
        if weight == "bold" || weight == "bolder" { return true }
        guard let n = Int(weight) else { return false }
        return n >= 600
    }
}
