// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The display list, painted with CoreGraphics.
//
// One backend for every Apple platform, on purpose. A `UIView` hands out a
// `CGContext` from `UIGraphicsGetCurrentContext()`, a SwiftUI `Canvas` hands
// one out from `GraphicsContext.withCGContext`, and a PDF or a bitmap context
// is the same object again — so an iPhone, an iPad, an Apple Watch and an
// off-screen render all go through this file rather than through four.
//
// The context is assumed FLIPPED: origin top left, y increasing downwards,
// which is what UIKit and SwiftUI both hand you and what the display list is
// already in. The one place that has to know is the text, because CoreText
// draws glyphs the other way up unless the text matrix says otherwise.
//
// Text is CoreText rather than UIKit for one reason: `CTFont` exists on every
// Apple platform including watchOS, and this file is the same file there.

import CoreGraphics
import CoreText
import Foundation

public final class CoreGraphicsEvgSurface: EvgSurface {

    private let ctx: CGContext
    /// Faces are made once and reused. This page draws 186 text runs a frame
    /// and asks for about six distinct faces; making a `CTFont` per run is the
    /// difference between a frame and a stutter.
    private var fontCache: [String: CTFont] = [:]

    public init(context: CGContext) {
        self.ctx = context
    }

    // MARK: - state

    public func save() {
        ctx.saveGState()
    }

    public func restore() {
        ctx.restoreGState()
    }

    public func clipRect(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat) {
        ctx.clip(to: CGRect(x: x, y: y, width: w, height: h))
    }

    public func rotate(degrees: CGFloat, px: CGFloat, py: CGFloat) {
        ctx.translateBy(x: px, y: py)
        ctx.rotate(by: degrees * .pi / 180.0)
        ctx.translateBy(x: -px, y: -py)
    }

    // MARK: - boxes

    private func boxPath(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat, radius: CGFloat) -> CGPath {
        let rect = CGRect(x: x, y: y, width: w, height: h)
        if radius <= 0.0 {
            return CGPath(rect: rect, transform: nil)
        }
        // A radius larger than half the box is a pill, and CoreGraphics draws
        // something wrong rather than a pill if it is not clamped.
        let r = min(radius, min(w, h) * 0.5)
        return CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)
    }

    private func applyShadow(_ shadow: EvgShadow?) {
        guard let s = shadow else { return }
        ctx.setShadow(offset: CGSize(width: s.dx, height: s.dy), blur: s.blur, color: s.color.cgColor)
    }

    public func fillRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat,
        color: EvgColor,
        gradient: EvgGradient?,
        shadow: EvgShadow?
    ) {
        if w <= 0 || h <= 0 { return }
        let path = boxPath(x: x, y: y, w: w, h: h, radius: radius)

        guard let grad = gradient else {
            ctx.saveGState()
            applyShadow(shadow)
            ctx.addPath(path)
            ctx.setFillColor(color.cgColor)
            ctx.fillPath()
            ctx.restoreGState()
            return
        }

        // A gradient cannot be a fill colour, so the shape becomes a clip and
        // the gradient is drawn through it. The shadow is the SHAPE's, not the
        // gradient's, so it is painted first as a flat fill of the first stop —
        // a gradient box under a shadow casts the box's silhouette.
        if shadow != nil {
            ctx.saveGState()
            applyShadow(shadow)
            ctx.addPath(path)
            ctx.setFillColor(grad.color1.cgColor)
            ctx.fillPath()
            ctx.restoreGState()
        }

        ctx.saveGState()
        ctx.addPath(path)
        ctx.clip()
        let space = CGColorSpaceCreateDeviceRGB()
        let colors = [grad.color1.cgColor, grad.color2.cgColor] as CFArray
        if let cg = CGGradient(colorsSpace: space, colors: colors, locations: [0.0, 1.0]) {
            let start = CGPoint(x: x, y: y)
            let end = grad.vertical ? CGPoint(x: x, y: y + h) : CGPoint(x: x + w, y: y)
            ctx.drawLinearGradient(cg, start: start, end: end, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        }
        ctx.restoreGState()
    }

    public func strokeRect(
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat, thickness: CGFloat,
        color: EvgColor
    ) {
        if w <= 0 || h <= 0 { return }
        // EVG's border is a band INSIDE the box, and a CoreGraphics stroke
        // straddles the path. Insetting by half the thickness puts the band
        // where the layout said it was — which is what keeps a one-point
        // hairline from spilling over the edge of a clipped scroll region.
        let half = thickness * 0.5
        let inset = CGRect(x: x + half, y: y + half, width: max(0, w - thickness), height: max(0, h - thickness))
        let r = radius > 0 ? max(0, min(radius - half, min(inset.width, inset.height) * 0.5)) : 0
        let path = r > 0
            ? CGPath(roundedRect: inset, cornerWidth: r, cornerHeight: r, transform: nil)
            : CGPath(rect: inset, transform: nil)
        ctx.saveGState()
        ctx.addPath(path)
        ctx.setStrokeColor(color.cgColor)
        ctx.setLineWidth(thickness)
        ctx.strokePath()
        ctx.restoreGState()
    }

    // MARK: - vector outlines

    /// `pts` is flat — x, y, x, y — and `ringEnds` holds the index one past
    /// each ring's last coordinate, so a shape with a hole arrives as two
    /// rings and is filled as one path with two subpaths.
    private func buildPath(pts: [Double], ringEnds: [Int], close: Bool) -> CGPath {
        let path = CGMutablePath()
        var start = 0
        for rawEnd in ringEnds {
            let end = min(rawEnd, pts.count)
            if end - start >= 4 {
                path.move(to: CGPoint(x: pts[start], y: pts[start + 1]))
                var i = start + 2
                while i + 1 < end {
                    path.addLine(to: CGPoint(x: pts[i], y: pts[i + 1]))
                    i += 2
                }
                if close { path.closeSubpath() }
            }
            start = max(start, end)
        }
        return path
    }

    public func fillPath(
        pts: [Double], ringEnds: [Int], evenOdd: Bool,
        color: EvgColor,
        shadow: EvgShadow?
    ) {
        let path = buildPath(pts: pts, ringEnds: ringEnds, close: true)
        if path.isEmpty { return }
        ctx.saveGState()
        applyShadow(shadow)
        ctx.addPath(path)
        ctx.setFillColor(color.cgColor)
        if evenOdd {
            ctx.fillPath(using: .evenOdd)
        } else {
            ctx.fillPath(using: .winding)
        }
        ctx.restoreGState()
    }

    public func strokePath(
        pts: [Double], ringEnds: [Int],
        thickness: CGFloat,
        color: EvgColor
    ) {
        // Not closed: a stroked ring in this page is an icon outline or the
        // chart's line, and closing it would draw a chord from the last point
        // back to the first one.
        let path = buildPath(pts: pts, ringEnds: ringEnds, close: false)
        if path.isEmpty { return }
        ctx.saveGState()
        ctx.addPath(path)
        ctx.setStrokeColor(color.cgColor)
        ctx.setLineWidth(thickness)
        ctx.setLineJoin(.round)
        ctx.setLineCap(.round)
        ctx.strokePath()
        ctx.restoreGState()
    }

    // MARK: - images

    /// This page reaches no images, and a surface that drew nothing for one
    /// would be indistinguishable from a surface that drew it wrong. A visible
    /// placeholder is the honest answer until an image cache is wired in.
    public func drawImage(
        src: String,
        x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
        radius: CGFloat,
        flipH: Bool, flipV: Bool
    ) {
        if w <= 0 || h <= 0 { return }
        let path = boxPath(x: x, y: y, w: w, h: h, radius: radius)
        ctx.saveGState()
        ctx.addPath(path)
        ctx.setFillColor(EvgColor(r: 220, g: 220, b: 226, a: 1.0).cgColor)
        ctx.fillPath()
        ctx.addPath(path)
        ctx.setStrokeColor(EvgColor(r: 150, g: 150, b: 160, a: 1.0).cgColor)
        ctx.setLineWidth(1.0)
        ctx.strokePath()
        ctx.move(to: CGPoint(x: x, y: y))
        ctx.addLine(to: CGPoint(x: x + w, y: y + h))
        ctx.strokePath()
        ctx.restoreGState()
    }

    // MARK: - text

    private func fontFor(size: CGFloat, family: String, bold: Bool, italic: Bool) -> CTFont {
        let key = "\(family)|\(size)|\(bold)|\(italic)"
        if let cached = fontCache[key] { return cached }

        let lower = family.lowercased()
        var base: CTFont
        if lower.contains("mono") || lower.contains("courier") || lower.contains("consol") {
            base = CTFontCreateWithName("Menlo" as CFString, size, nil)
        } else if lower.contains("serif") && !lower.contains("sans") {
            base = CTFontCreateWithName("Georgia" as CFString, size, nil)
        } else {
            // The platform's own sans. `gallery/ui` lays out with EVG's width
            // estimate rather than a face, exactly as the browser build does,
            // so bundling a TrueType file here would make the picture *less*
            // like the one the demo is checked against, not more.
            base = CTFontCreateUIFontForLanguage(.system, size, nil)
                ?? CTFontCreateWithName("Helvetica" as CFString, size, nil)
        }

        var traits: CTFontSymbolicTraits = []
        if bold { traits.insert(.traitBold) }
        if italic { traits.insert(.traitItalic) }
        if !traits.isEmpty {
            if let styled = CTFontCreateCopyWithSymbolicTraits(base, size, nil, traits, traits) {
                base = styled
            }
        }
        fontCache[key] = base
        return base
    }

    public func drawTextRun(
        text: String,
        x: CGFloat, top: CGFloat,
        sizePx: CGFloat,
        family: String, bold: Bool, italic: Bool,
        color: EvgColor
    ) {
        if text.isEmpty || sizePx <= 0 { return }
        let font = fontFor(size: sizePx, family: family, bold: bold, italic: italic)
        // CoreText's own attribute names, spelled the long way round.
        // `kCTFontAttributeName` is a `CFString`; `NSAttributedString.Key` is
        // not, and UIKit's `.foregroundColor` is a DIFFERENT string that
        // CoreText does not read.
        let attributes: [NSAttributedString.Key: Any] = [
            NSAttributedString.Key(kCTFontAttributeName as String): font,
            NSAttributedString.Key(kCTForegroundColorAttributeName as String): color.cgColor,
        ]
        let line = CTLineCreateWithAttributedString(
            NSAttributedString(string: text, attributes: attributes)
        )
        ctx.saveGState()
        // `top` is the top of the line box; the baseline is one ascent below
        // it. And the text matrix is flipped because the context is: without
        // it CoreText draws every glyph upside down in a UIKit context.
        ctx.textMatrix = CGAffineTransform(scaleX: 1.0, y: -1.0)
        ctx.textPosition = CGPoint(x: x, y: top + CTFontGetAscent(font))
        CTLineDraw(line, ctx)
        ctx.restoreGState()
    }
}
