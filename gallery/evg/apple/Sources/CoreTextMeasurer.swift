// SPDX-License-Identifier: AGPL-3.0-or-later
//
// CoreText measures, EVG breaks the lines.
//
// PLAN_NATIVE_HOSTS.md S0, the Apple half. `EVGHostTextMeasurer` (Ranger,
// compiled into the app's generated Swift) takes ONE function from the
// platform — a run's width, and a face's ascent, descent and leading — and
// every layout the app builds then measures with it. Before this the layout
// measured with the advance table, a snapshot of one browser's sans, and
// `CoreGraphicsEvgSurface` drew with whatever `EvgFontCache` resolved: two
// faces, and a caret or a label's box placed from the wrong one.
//
// The face is the SAME `CTFont` the surface draws with — `EvgFontCache.shared`
// is asked with the same four arguments `drawTextRun` asks it with — so the
// width the layout measured is the width `CTLineDraw` puts on the screen.
// `CTLineGetTypographicBounds` is the advance CoreText itself lays the line
// out to, kerning and all, which is what makes this exact rather than close.
//
// Install once, before the app's `start`, on any thread: `CTFont` is
// immutable and the cache is locked, so the layout may run off the main
// actor (S1) and measure where it lays out.
//
// Nothing here is compiled by this repository's CI — Swift for Apple needs a
// Mac — which is the same standing as the rest of this directory.

import CoreGraphics
import CoreText
import Foundation

enum CoreTextMeasurer {

    /// Make the measurer, attach CoreText to it and make it the default every
    /// `EVGLayout` and `EVGTextEngine` in the process starts from.
    ///
    /// Idempotent in effect: a second call installs a second measurer, which
    /// answers the same numbers from the same cache.
    @discardableResult
    static func install() -> EVGHostTextMeasurer {
        let measurer = EVGHostTextMeasurer()
        measurer.attach(f: metric, name: "coretext")
        EVGDefaultMeasurer.install(m: measurer)
        return measurer
    }

    /// The one function. `kind` 0 is the width of `text`; 1, 2 and 3 are the
    /// face's ascent, descent and leading, for which `text` is empty.
    static func metric(_ kind: Int, _ text: String, _ family: String,
                       _ size: Double, _ bold: Bool, _ italic: Bool) -> Double {
        let font = EvgFontCache.shared.face(size: CGFloat(size), family: family, bold: bold, italic: italic)
        switch kind {
        case 0:
            if text.isEmpty { return 0 }
            let attributes: [NSAttributedString.Key: Any] = [
                NSAttributedString.Key(kCTFontAttributeName as String): font,
            ]
            let line = CTLineCreateWithAttributedString(
                NSAttributedString(string: text, attributes: attributes)
            )
            return CTLineGetTypographicBounds(line, nil, nil, nil)
        case 1:
            return Double(CTFontGetAscent(font))
        case 2:
            return Double(CTFontGetDescent(font))
        default:
            // The face's own line gap. `line-height: normal` is ascent +
            // descent + this, which is what CoreText's own layout uses too.
            return Double(CTFontGetLeading(font))
        }
    }
}
