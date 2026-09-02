# `gallery/evg/apple` — the EVG display list, painted with CoreGraphics

**License: AGPL-3.0-or-later** (Gallery).

The Apple sibling of [`gallery/evg/android`](../android/README.md), and
deliberately the same shape: an `EvgSurface` protocol of eight drawing calls,
one `EvgPainter` that decides what each display-list command *means*, and a
backend per drawing API.

There is only one backend here, and that is the point. A `UIView` hands out a
`CGContext` from `UIGraphicsGetCurrentContext()`; a SwiftUI `Canvas` hands one
out from `GraphicsContext.withCGContext`; a bitmap or a PDF context is the same
object again. So an iPhone, an iPad, an Apple Watch and an off-screen render all
paint through `CoreGraphicsEvgSurface`, not through four surfaces that have to
be kept in step.

```
   EVGDisplayList                    (Ranger, compiled to Swift)
         │
   EvgPainter.paint(list, into:)     what a command MEANS — written once
         │
   EvgSurface                        eight calls, and nothing else
         │
         ├── CoreGraphicsEvgSurface  CGContext   ← UIKit, SwiftUI, watchOS
         └── RecordingSurface        counts what was dispatched
```

| File | Lines | What it is |
| --- | --- | --- |
| `Sources/EvgSurface.swift` | 163 | The protocol, and the colour/gradient/shadow types it takes |
| `Sources/EvgPainter.swift` | 213 | The walk: a display list in, surface calls out |
| `Sources/CoreGraphicsEvgSurface.swift` | 291 | Boxes, borders, paths, images and CoreText, on a `CGContext` |
| `Sources/RecordingSurface.swift` | 110 | Draws nothing, counts everything |

## What the painter is careful about

`EvgPainter` is a transliteration of the Kotlin one rather than a second reading
of the format. Where the two disagree, one of them is wrong. Four things it
carries that a JSON-fed backend cannot:

* **Gradients and shadows.** `EVGDisplayList.toJson` carries neither, so a
  browser host cannot draw them. Reading the objects directly brings both back.
* **Clipping.** `save`/`clipRect`/`restore`, with a depth counter: a list that
  pushes more clips than it pops must not leave the surface clipped for the rest
  of the frame, and one that pops more than it pushes must not restore past the
  state the host handed over. On CoreGraphics the first of those is a page with
  most of it missing.
* **Multi-ring paths.** `ringEnds` gives the index one past each ring's last
  coordinate, so a shape with a hole is one path with two subpaths and a real
  even-odd fill.
* **Rotation about a command's own box centre**, wrapped in save/restore so the
  clip stack above is untouched.

## Three things CoreGraphics needs that Skia did not

**Text is upside down unless you say otherwise.** The context is flipped —
origin top left, y down, which is what UIKit and SwiftUI both hand you and what
the display list is already in — and CoreText draws glyphs the other way up.
`ctx.textMatrix = CGAffineTransform(scaleX: 1, y: -1)` is the fix, and it is one
line in exactly one place.

**`top` is not the baseline.** EVG measured the run and the baseline sits one
face-ascent below the top of the line box. `CTFontGetAscent` is where that comes
from, and the surface owns the conversion because only it knows what its own
metrics say.

**A border is a band INSIDE the box.** A CoreGraphics stroke straddles its path,
so `strokeRect` insets by half the thickness and shrinks the corner radius to
match. Without it a one-point hairline spills over the edge of a clipped scroll
region.

## Fonts

`CTFont`, not `UIFont`: CoreText exists on every Apple platform including
watchOS, so this is the same file there. The family name from the display list
picks between a monospace face, a serif and the platform's own sans; bold and
italic go through `CTFontCreateCopyWithSymbolicTraits`.

No font files are bundled. `gallery/ui` lays out with EVG's own width estimate —
the same one the browser demo uses — so a real TrueType file here would make the
picture *less* like the one the demo is checked against, not more. That is the
same call [`gallery/ui/android`](../../ui/android/README.md) made and the
opposite of the one the pptx port made, for the opposite reason: a deck is
measured against the faces it was authored in.

## What is checked, and where

Nothing in this directory is compiled by this repository's CI, because Swift for
Apple platforms needs a Mac. What IS checked, on any machine, is everything the
painter is handed:
[`gallery/ui/ios/ranger/check_ios.rgr`](../../ui/ios/ranger/check_ios.rgr)
asserts that the page reaches text, filled boxes, borders, rounded corners,
clipping, a filled path and stroked paths — and that every clip pushed is
popped, which is the invariant this painter exists to keep.

`RecordingSurface` is the Mac-side half of that: wrap the real surface in one,
paint a frame, and the tally says what the **painter** dispatched rather than
what the page produced.

## Related

* [`gallery/evg/android`](../android/README.md) — the same interface over
  `android.graphics.Canvas` and `java.awt.Graphics2D`
* [`gallery/ui/ios`](../../ui/ios/README.md) — the dashboard demo through this
  painter, on iPhone, iPad and Apple Watch
