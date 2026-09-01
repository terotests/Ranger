# The dashboard demo on Android (Ranger → Kotlin → `android.graphics`)

[`gallery/ui/demo`](../demo)'s **dashboard** — shadcn's `dashboard-01`, with a
navigation sidebar, four figure cards, a Vega chart that is really computed, a
virtualised data table and a scrolling page — as an Android app. Not a rewrite
and not a WebView: the same `DashboardDemo.rgr` the browser page and the gates
run, compiled to **Kotlin** and painted with `android.graphics.Canvas`.

```text
gallery/ui/demo/DashboardDemo.rgr   the page: controllers, tree literals,
gallery/ui/src/*.rgr                cascade, layout, table, sortable
gallery/evg/*.rgr                   EVG: units, flex, clip, display list
gallery/vela/*.rgr                  the chart's runtime — all Ranger
      │
      │  node bin/output.js -l=kotlin       (scripts/build-ranger.sh)
      ▼
generated/ui_android.kt             ~46k lines, one file, package fi.ranger.rgr
      │
      │  UiAndroid.frame() : EVGDisplayList
      ▼
gallery/evg/android                 the shared painter and the two surfaces
      │
      ├── AndroidEvgSurface         android.graphics.Canvas      ← the app
      └── AwtEvgSurface             java.awt.Graphics2D          ← the check
```

There is no dashboard code in this directory. The controllers, the stylesheet
cascade, the flex layout, the scroll container, the virtualiser, the Vega
runtime and the display list are all `gallery/ui` and `gallery/evg`, and this
port does not fork a line of any of them.

## What is here

| Path | What it is |
| --- | --- |
| `ranger/ui_android.rgr` | The facade — the only Ranger written for Android, and it is a *viewport* |
| `app/…/MainActivity.kt` | One asset in, one view on screen |
| `app/…/DashboardView.kt` | The `View`: units, touch, gestures, the fling |
| `desktop/…/CheckDashboard.kt` | The page through the shared painter, and every input rule |
| `scripts/` | Ranger→Kotlin, the stylesheet, APK, emulator, and the two off-device checks |
| `package.json` | The same scripts under short names, so `npm run run` works from in here |

The painter, the surface interface, the `android.graphics` backend, the Java2D
twin and the platform stubs are **not** here: they are
[`gallery/evg/android`](../../evg/android/README.md), shared with the
[pptx port](../../pptx/android/README.md).

## Build and run

```bash
# 1. the page, compiled from Ranger to Kotlin   (needs bin/output.js)
bash gallery/ui/android/scripts/build-ranger.sh

# 2. the demo's stylesheet into app/src/main/assets
bash gallery/ui/android/scripts/prepare-assets.sh

# 3. the APK                                    (needs an Android SDK + JDK 17)
bash gallery/ui/android/scripts/build-app.sh debug
```

…or all three at once: `npm run ui:android`.

To build it, put it on an emulator and open it — starting the emulator if none
is running:

```bash
npm run ui:android:run
npm run ui:android:run -- --avd Pixel_Tablet_API_34   # pick the image
npm run ui:android:run -- --logcat                    # …and tail the app's log
npm run ui:android:run -- --no-build                  # reinstall what is built
```

It finds the SDK through `ANDROID_HOME` / `ANDROID_SDK_ROOT`, falling back to
the usual Android Studio locations, and uses a device that is already online in
preference to booting one. **A tablet profile in landscape is what this wants**
(`Pixel Tablet`, API 34): the page is 1336 wide, so 1280dp of landscape tablet
is very nearly 1:1 and the dashboard is the size it is in a browser.

This directory is also a package of its own, so the same thing from in here is
`npm run run` — or `npm start`, which is the same script — and from anywhere
else it is `npm run --prefix gallery/ui/android run`. Arguments go through after
a `--` exactly as above. The scripts find the repository root themselves, so it
does not matter which directory you are standing in.

| From `gallery/ui/android` | From the repository root |
| --- | --- |
| `npm run run` / `npm start` | `npm run ui:android:run` |
| `npm run build` | `npm run ui:android` |
| `npm run build:ranger` | `npm run ui:android:ranger` |
| `npm run assets` | `npm run ui:android:assets` |
| `npm run verify` | `npm run ui:android:verify` |
| `npm run typecheck` | `npm run ui:android:typecheck` |

By hand, the same two steps are:

```bash
adb install -r gallery/ui/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n fi.ranger.ui/.MainActivity
```

### Checking the port without Android

```bash
npm run ui:android:verify      # paint the page through the shared painter
npm run ui:android:typecheck   # type-check the two Android-only files
```

`verify` compiles the generated Kotlin with `kotlinc` and then asks three
questions.

**Does the page draw?** The frame is painted through a `RecordingSurface` that
counts what was dispatched, so "some ink appeared" is not the bar: the run
asserts the page reaches text, filled boxes, borders, rounded corners, clipping,
a filled path and stroked paths, and that every `save` was restored. On a
1280×800 tablet that is 352 commands — 186 text runs, 54 outlines, 44 boxes, 51
stroked paths and one filled one. What no part of the page reaches is
**printed** rather than left silent: today that is images, gradients, shadows,
rotation and italics.

The stroked paths are worth naming. The sidebar's icons are lucide's, which are
outlines rather than silhouettes, and so is the chart's line — `strokePath` is a
command **no pptx fixture reaches**, so this page is the first thing in the
repository that would notice if the shared painter dropped it.

**Does the viewport arithmetic hold?** That is the one thing this port adds, and
it is all in `ranger/ui_android.rgr`: the fit scale, the page height a screen is
worth, a pinch that has to leave the point under the fingers where it was, and a
pan that stops at the edge. Checked in the same generated Kotlin the app runs,
not in a second implementation of the same sums.

**Does the ripple get the right numbers?** The shader itself needs a device, but
what the host hands it does not: a touch has to become a PAGE coordinate (a host
that passed screen pixels would ring somewhere else, and be wrong by more the
further you are from the origin), the ages have to advance on the frame clock,
and the page has to go quiet on its own after about three seconds or the host
asks for frames forever.

**Does a finger land?** Screen coordinates in, a test id out, and the page
changes: a tap on a sidebar link moves the page you are on, a tap on a range
button selects it and the chart is rebuilt, a drag scrolls and stops at the
bottom rather than past it, and PageDown / Home / End do what the browser's do.
The presses are found by hit-testing the screen the way the app does, not by
calling `press(id)` — the coordinate conversion is exactly what this port adds
and therefore what is worth checking.

59 checks, `kotlinc` and a JDK, no SDK, no emulator, no device. It writes
`tmp/ui-android/dashboard.png` (a landscape tablet), `dashboard-portrait.png`
(the same tablet turned) and `dashboard-phone.png` (a 411×823 phone), so the
result is something to look at rather than a number.

`ui:android:typecheck` covers most of what is left: `MainActivity` and
`DashboardView` against `gallery/evg/android/androidstubs/`, which declares the
platform members the host calls with the signatures the SDK gives them. It is
not evidence that the app *draws* correctly — a stub cannot draw — but an
unchecked file is where a typo lives for a month.

## The design, and why it is shaped like this

### The page is a document, and the screen is a viewport

The demo is **1336 pixels wide and that number is load-bearing**: the chart's
994 and every axis label measured against it are derived from it, and the
comment above `pageW` says so. So a phone does not get a narrower dashboard, it
gets the same one at a smaller scale — `fitScale = screenW / 1336`, and the
canvas is scaled by it.

### A screen taller than the page

The first thing the emulator found. The page, the sidebar and the hairline
between them all stated `height: 1420px` in the stylesheet — the height this
page was *before* it scrolled, kept because every window it had been shown in
was shorter than that and a column taller than the window looks full.

A tablet in portrait is not shorter than that. 800dp of width scales the page by
0.6, so 1280dp of height is 2137 page pixels: the sidebar stopped two thirds of
the way down, and below it was the host's own background.

`height: 100%` could not fix it — a percentage needs a parent with a definite
height, and the page's own height is exactly the number nobody in the tree has —
so EVG grew the unit that asks the layout instead:
[`vw` and `vh`](../../evg/EVGUnit.rgr) resolve against `EVGLayout.pageWidth` /
`pageHeight`, which every host already sets and which on paper is the page area,
the sheet less its margins. The page, the sidebar, the hairline and the scroll
box all say `100vh` now, and the stylesheet no longer names a number that only
one viewport made true.

The account row rides the bottom edge either way, because `.db-side-body` is
`flex: 1`. In the browser demo, where the viewport is 900, that row is now *on*
the page instead of 470 pixels below it.

The other half is the one that is easy to get wrong. `pageH` is a **viewport**:
the sidebar stands still and the content scrolls under it, and the demo clamps
the scroll offset to its own `pageH`. A host that scaled the canvas and left
`pageH` alone would get a page that stops scrolling half a screen early, or
keeps going past its end, depending on which way the screen differs. So the
facade sets `pageH = screenH / scale` on every fit, and the demo's own scroll
container does the rest, because it already knew how.

### Nothing is rasterised at a fixed size

The canvas is scaled by `density × fit`; the display list is left alone. Text
and vector shapes are therefore drawn *through* the scale rather than blitted
from a bitmap made at some other size, which is why a pinch stays sharp. It is
the same trick the WebGL host plays with `dpr` and the pptx port plays with
`density`.

### No JSON in the middle

`PptxWeb` and the browser demo both serialise the display list, because a page
has to parse something anyway. Android has no such boundary: `UiAndroid.frame()`
returns the `EVGDisplayList` itself. Nothing is allocated per frame beyond the
list the page already built, and the gradients and shadows `toJson` does not
carry would survive to the painter — this page happens to use neither, but the
seam is the same one the deck uses.

### A touch does not re-run the chart

`DashboardDemo.hitId` repaints the whole page before answering, chart included.
That is the right trade for a browser calling it once per click, and the wrong
one for a touchscreen: every `ACTION_DOWN` would run the Vega runtime again for
geometry the hit test cannot reach, because **the chart is not in the element
tree**. So the facade uses `hitIdCached`, which hit-tests the layout that is
already there — and `rebuild()` now marks that layout stale, which it always
should have: it builds new elements, so the rectangles in the cached layout
belong to a tree that no longer exists.

### The ripple is a shader, so it is not in the painter

`evg-surface-effect: ripple` is the one thing on this page that is not a draw
command and cannot be: it is a pass over the FINISHED pixels — the page is
drawn, then read back through a program that bends the sample position in a ring
around wherever the surface was touched. The WebGL host renders to a texture and
draws that texture through a fragment shader; `android.graphics.Canvas` has no
equivalent stage, which is why this port shipped without it.

`RuntimeShader` (API 33) is that stage. `RenderEffect.createRuntimeShaderEffect`
renders the view into a texture, binds it to a named `uniform shader`, and lets
the program decide every pixel — so [`RippleEffect`](../../evg/android/src/android/kotlin/fi/ranger/evg/RippleEffect.kt)
is a translation of `evg-webgl.js`'s `RIPPLE_FRAG` into AGSL rather than a
second effect to keep in step with the first. Two things are different and both
are simplifications: a view's coordinates run y-down like the page, so the flips
a GL texture needs are gone; and AGSL has no `dFdx`, so the height field's
gradient — where the glint comes from — is a finite difference one page pixel
away instead of a hardware derivative.

Below API 33 nothing happens and the page draws as it always did. If the shader
will not compile or a uniform is rejected, the effect turns itself off and says
so once under the `EvgRipple` tag — `npm run ui:android:run -- --logcat`.

**A ripple frame does not redraw the page.** Ageing a touch changes nothing
about what was drawn, so the clock only updates the shader's uniforms and
re-composites; the layout, the chart and the painter are not asked again. That
is also why the view now caches its frame: `UiAndroid.frame()` lays the page out
and runs the chart's Vega runtime, which is the right cost for a page that
changed and the wrong one for an animation.

### The gestures are in Ranger, the `MotionEvent` unpacking is not

`DashboardView` is the one file here that cannot run without a device, so every
rule that lived in it would be a rule nothing can check. The scale, the
conversion from screen to page, the pinch's focus point and the pan's limits are
all in the facade, driven by `CheckDashboard` on a JVM. What is left in the view
is unpacking a `MotionEvent`, a fling that decays, and the key table.

**Nothing in the host consumes a touch.** `GestureDetector.onTouchEvent` returns
whatever its listener returned, and `onDown` returning `true` — which is what
almost every example writes — makes it swallow every `ACTION_DOWN`. A host that
treats that as "handled" has eaten the press: the page never learns a finger
landed, so nothing responds while it still renders perfectly. Every callback
here returns `false`.

### The platform's own face, deliberately

The pptx port bundles the four `.ttf` files the deck was measured against,
because a substituted face would put the same glyphs at widths the layout never
agreed to. This page is different: `gallery/ui` lays out with EVG's own width
estimate — the same one the browser demo uses — so no font file would make the
estimate truer. The honest choice is the platform's sans on both surfaces, which
is also what the browser draws with.

## Status

Verified, off-device, on this repository's own demo:

* `ranger/ui_android.rgr` and the whole `gallery/ui` + `gallery/evg` +
  `gallery/vela` tree behind it compile to Kotlin, and **`kotlinc` accepts the
  result with zero errors** (46k lines, one file).
* The compiled page builds and lays itself out on a JVM — cascade, flex, scroll
  container, virtualised table, the Vega runtime — and answers with a display
  list of 352 commands at 1280×800.
* `EvgPainter` + `AwtEvgSurface` render it: the sidebar with its nine icons, the
  four cards, the chart with its axes and labels, the tab strip, the table with
  its badges and its checkbox column, and the scrollbar indicator.
* The viewport arithmetic, the presses, the scrolling, the keys and the
  pinch/pan hold, and a screen taller than the page's content still gets a
  full-height sidebar with its account row on the bottom edge, and the ripple's
  touches land in page coordinates, age on a clock and retire on their own.
  59 checks.
* `MainActivity` and `DashboardView` type-check against the platform stubs.

Not verified here: the APK build, and whether Skia draws what the surface asks
it to. Both need an Android SDK, and `dl.google.com` is not reachable from the
environment this was written in.

Known gaps, in rough order of how much they would be missed:

* **The ripple needs API 33.** `evg-surface-effect: ripple` is a post-process
  over the finished surface, and a `Canvas` painter has no such stage —
  `RuntimeShader` does, so the effect is there on Android 13 and later and
  absent below it. See below.
* **No accessibility mirror.** The browser page mirrors `a11yJson()` into real
  DOM over the canvas, because a canvas hands a screen reader one empty graphic.
  The Android equivalent is a `View.AccessibilityDelegate` with a virtual view
  hierarchy, and the tree to build it from is already there — `a11yJson` is
  compiled into this APK and nothing calls it. That is the single most valuable
  thing to add next.
* **No text input.** The table's filter and the form controls on other demo
  pages want an `InputConnection`.
* **One page.** The dashboard only; the other twelve demos in
  `gallery/ui/demo` are a facade each away.

## Related

* [`gallery/ui`](../README.md) — the controllers, and what they are measured
  against
* [`gallery/ui/demo`](../demo) — the same page in a browser
* [`gallery/evg/android`](../../evg/android/README.md) — the painter and the two
  surfaces this port draws through
* [`gallery/pptx/android`](../../pptx/android/README.md) — the first Android
  port, and the one this follows
