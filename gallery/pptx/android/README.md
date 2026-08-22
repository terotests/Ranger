# PPTX viewer on Android (Ranger → Kotlin → `android.graphics`)

The [PPTX viewer](../README.md) as an Android app. Not a rewrite and not a
WebView: the same `gallery/pptx/src/*.rgr` the browser build, the SDL desktop
host and the oracles run, compiled to **Kotlin** and painted with
`android.graphics.Canvas`.

```text
gallery/pptx/src/*.rgr          the viewer: OPC/ZIP, OOXML, theme resolve,
gallery/evg/*.rgr               layout, display list — all Ranger
      │
      │  node bin/output.js -l=kotlin       (scripts/build-ranger.sh)
      ▼
generated/pptx_android.kt       ~66k lines, one file, package fi.ranger.pptx.rgr
      │
      │  PptxAndroid.frame() : EVGDisplayList
      ▼
EvgPainter (common/)            one walk, eight command kinds
      │
      ├── AndroidEvgSurface     android.graphics.Canvas      ← the app
      └── AwtEvgSurface         java.awt.Graphics2D          ← the test
```

There is no PowerPoint code in this directory. The ZIP reader, the OOXML
parser, the theme→master→layout resolver, the JPEG and PNG decoders, the
TrueType reader, the EVG layout engine and the display list are all Ranger, and
this port does not fork a line of any of them.

## What is here

| Path | What it is |
| --- | --- |
| `ranger/pptx_android.rgr` | The host facade — the only Ranger written for Android |
| `common/…/EvgSurface.kt` | The eight things a backend has to draw |
| `common/…/EvgPainter.kt` | The walk: display list → surface calls. Shared |
| `app/…/AndroidEvgSurface.kt` | `android.graphics` implementation of the surface |
| `app/…/SlideView.kt` | The `View`: units, touch, gestures, the show's clock |
| `app/…/MainActivity.kt` | Assets, the file picker, Back, the menu |
| `desktop/…/AwtEvgSurface.kt` | The same surface on Java2D, so the port is testable |
| `desktop/…/RenderDeck.kt` | Deck → PNGs, off-device |
| `desktop/androidstubs/` | Platform declarations so the host type-checks without an SDK |
| `scripts/` | Ranger→Kotlin, assets, APK, emulator, and the two off-device checks |

## Build and run

```bash
# 1. the viewer, compiled from Ranger to Kotlin   (needs bin/output.js)
bash gallery/pptx/android/scripts/build-ranger.sh

# 2. four fonts and a deck into app/src/main/assets
bash gallery/pptx/android/scripts/prepare-assets.sh

# 3. the APK                                      (needs an Android SDK + JDK 17)
bash gallery/pptx/android/scripts/build-app.sh debug
```

…or all three at once: `npm run pptx:android`.

To build it, put it on an emulator and open it — starting the emulator if none
is running:

```bash
npm run pptx:android:run
npm run pptx:android:run -- --avd Pixel_Tablet_API_34   # pick the image
npm run pptx:android:run -- --deck gallery/pptx/fixtures/09-kitchen.pptx
npm run pptx:android:run -- --logcat                    # …and tail the app's log
npm run pptx:android:run -- --no-build                  # reinstall what is built
```

It finds the SDK through `ANDROID_HOME` / `ANDROID_SDK_ROOT`, falling back to
the usual Android Studio locations, and uses a device that is already online in
preference to booting one — so a plugged-in tablet needs no flag. An emulator
image with a tablet profile (`Pixel Tablet`, API 34) is what this was designed
against: the app is a document viewer and wants the room.

By hand, the same two steps are:

```bash
adb install -r gallery/pptx/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n fi.ranger.pptx/.MainActivity
```

### Checking the port without Android

```bash
npm run pptx:android:verify      # render fixture decks through the shared painter
npm run pptx:android:typecheck   # type-check the three Android-only files
```

This compiles the generated Kotlin with `kotlinc`, opens five fixture decks on
the JVM, renders every slide through the **same** `EvgPainter` the app uses, and
writes PNGs to `tmp/pptx-android/`. It needs `kotlinc` and a JDK and nothing
else — no SDK, no emulator, no device.

It is not a substitute for running the app, but it covers everything except the
three Android-only files: Ranger→Kotlin compiling at all, the viewer parsing a
real `.pptx` on a JVM, the display list coming out with the right commands in
it, the painter walking them, and the result being a slide rather than an empty
page.

`pptx:android:typecheck` covers most of what is left. `desktop/androidstubs/`
declares the platform members the host calls, with the signatures the SDK gives
them, which is enough for `kotlinc` to say whether `AndroidEvgSurface`,
`SlideView` and `MainActivity` are well-formed, whether their overrides match,
and whether they call anything that does not exist. It is not evidence that the
app *draws* correctly — a stub cannot draw — but an unchecked file is where a
typo lives for a month, and it found one on the first run: a KDoc line
containing `src/` followed by a wildcard opened a **nested** block comment
(Kotlin's nest, unlike Java's), which the parser then closed sixty lines later
inside a string literal, taking half the class with it.

## The design, and why it is shaped like this

### The seam is the display list, not a picture

EVG "computes geometry and stops there"; an `EVGDisplayList` is a flat array of
absolute pixels and resolved colours — rect, border, image, text run, clip
push/pop, filled path, stroked path. That is small enough that a backend is a
page of delegation rather than a renderer, which is why this port is a few
hundred lines of Kotlin rather than a second implementation of PowerPoint.

### No JSON in the middle

The browser host serialises the display list (`sceneJson()`) because a page has
to parse it back anyway. Android has no such boundary: the viewer and the host
are objects in one JVM, so `PptxAndroid.frame()` returns the `EVGDisplayList`
itself. Two things follow.

* **Nothing is allocated per frame** beyond the list the app already built —
  no string of 25–30 KB per slide, no parse.
* **Gradients and shadows survive.** `EVGDisplayList.toJson` carries neither, so
  the WebGL host *cannot* draw them; only the CPU rasteriser does. Reading the
  objects gets them back.

The painter also honours two things the software rasteriser drops: `PUSH_CLIP` /
`POP_CLIP` (it ignores them) and multi-ring paths with an even-odd rule (it
flattens every path to a single polygon, so a ring with a hole comes out solid).
Both are one line on a `Canvas`.

### Input does not rasterise anything

`PptxWeb.pointerAt` calls `app.render()`, which paints the whole frame into
SoftCanvas — and the page then throws those pixels away and asks for the scene
instead. On a phone that is a full CPU rasterisation per touch event, for
nothing. This facade's `pointerAt` only updates the app; pixels are the
painter's job.

### Density-independent pixels, and why the zoom stays sharp

The app is sized and hit-tested in **dp**; the canvas is scaled by the display
density instead. So a 30dp toolbar is a touchable 30dp on every screen, and text
and vector shapes still rasterise at the panel's real resolution — they are
drawn *through* the scale rather than blitted from a bitmap made at some other
size. It is the same trick the WebGL host plays with `dpr`, and it is why
pinch-zooming during a show stays crisp instead of going soft: nothing was ever
rasterised at a fixed size.

### Text is drawn, not blitted

The viewer measured every run with its own TrueType reader against the four
`.ttf` files in `assets/fonts`, and each `TEXT` command carries the run's origin,
size and face. So Skia is handed the same glyphs at the same place — which is
also why the host must draw with *those* files: a substituted face would put the
same glyphs at widths the layout never agreed to.

A `TEXT` command's `y` is the top of the **line box**, not the baseline; the
baseline is one face-ascent below. Getting that wrong lifts every run by the
empty space above its capitals. Both surfaces convert it the same way, from
their own font metrics.

### Two interfaces, deliberately

A slide viewer wants two quite different things from a touchscreen, and blending
them makes both worse:

| | Not presenting | Presenting |
| --- | --- | --- |
| Tap | goes to the app (toolbar, slide panel, shapes) | left half back, right half forward |
| Horizontal fling | previous / next slide (over the page only) | previous / next slide |
| Pinch | — | zoom 1×–6× |
| Drag | the app's own pointer | pan, while zoomed |
| Double tap | — | back to fit |
| Back | leaves the app | leaves the show |

`Present` is on the menu, and is the app's own `show.start` command — the same
dotted id the desktop toolbar and the browser use. Transitions and builds run
off the host's clock: `SlideView` ticks and re-posts only while
`app.animating()` is true, so a still slide costs nothing on a battery.

### On the GPU, and staying there

The view is hardware-accelerated — the default, left alone deliberately. On
Android the accelerated `Canvas` **is** the GPU path: Skia draws it through
Ganesh (Vulkan on current devices), and it brings glyph rasterisation, path
filling and antialiasing with it. That is why this port draws through `Canvas`
rather than through a `GLSurfaceView` and a hand-written GLES backend the way
[`gallery/datagrid/platform/sdl`](../../datagrid/platform/sdl/README.md) has to
— that host has no Skia under it and must build its own text atlas and shaders.
Here the atlas already exists and is better than one we would write.

The one thing an accelerated canvas will not do is a `BlurMaskFilter`, and it
does not fail: it draws a hard-edged grey shape, which is worse than no shadow.
Forcing the whole view onto `LAYER_TYPE_SOFTWARE` to get the blur back would
trade the GPU for one effect on a page whose other few hundred commands want
it. So `AndroidEvgSurface` **draws** the falloff instead of filtering it: the
silhouette a few times, each pass grown by a stroke and drawn fainter. Ordinary
draw calls, batched like any other geometry, and at the blur radii a deck
actually asks for (`outerShdw` is usually a few points) the difference from a
true Gaussian is not visible on a slide. `RenderEffect.createBlurEffect` is the
exact upgrade, at API 31+ and a `RenderNode` per shape.

The surface asks the canvas, not the view, so a software canvas — a screenshot,
a bitmap-backed one, a host that does set a software layer — still gets the real
blur.

**The Java2D twin is not accelerated, and is not meant to be.** `RenderDeck`
renders into a `BufferedImage` on a headless JVM; Java2D's OpenGL and Metal
pipelines only apply to on-screen surfaces and `VolatileImage`, so that path is
software rasterisation by construction. It is a test harness that writes PNGs,
not the app.

### No dependencies

The app declares none — not even AndroidX. The viewer is Ranger compiled to
Kotlin and the host is four files against the platform SDK. `minSdk` is 21.

## Status

Verified, off-device, on this repository's fixtures:

* `ranger/pptx_android.rgr` and the whole `gallery/pptx` + `gallery/evg` tree
  compile to Kotlin, and **`kotlinc` accepts the result with zero errors**
  (66k lines, one file).
* The compiled viewer opens real `.pptx` packages on a JVM — ZIP, OOXML, theme
  and placeholder resolution, JPEG and PNG decoding, TrueType metrics, EVG
  layout — and answers with a display list per slide.
* `EvgPainter` + `AwtEvgSurface` render `20-business-deck`, `09-kitchen`,
  `21-gradient`, `25-table` and `28-transitions`: chrome, slide panel with
  thumbnails, titles, body text with per-run colour, rounded rects, ellipses and
  `custGeom` chevrons as real curves, two-stop gradients, PNG and JPEG pictures,
  tables, notes and the status bar.
* Per slide change on a warm JVM at 1280×800: **1–10 ms** to build the frame,
  **8–28 ms** to paint it. Neither is per frame — a still slide is not
  repainted.

* `AndroidEvgSurface`, `SlideView` and `MainActivity` type-check against the
  platform stubs — well-formed, overrides matching, nothing called that does not
  exist.

Not verified here: the APK build, and whether Skia draws what the surface asks
it to. Both need an Android SDK, and `dl.google.com` is not reachable from the
environment this was written in. `AndroidEvgSurface` is the one place a reviewer
should look hardest.

Known gaps, in rough order of how much they would be missed:

* **Saving is not wired up.** `PptxApp` can write a package back
  (`PptxWriter`), and the facade deliberately does not expose it: an Android
  viewer that can edit but not save is worse than one that only views. Editing
  through the app's toolbar therefore changes a deck the app will not keep.
* **No text input.** Typing needs an `InputConnection`; `app.type()` is exposed
  and unused, so the editing half of the toolbar is reachable but half-armed.
* **One font family.** The four Open Sans faces are bundled and every family
  name resolves to them, so a deck asking for Calibri gets Open Sans metrics —
  which is what the browser build does too.
* **No print / export.** The PDF path exists in `gallery/pdf_writer` and is
  not wired here.

## Why PPTX first

The spreadsheet ([`gallery/datagrid`](../../datagrid/README.md)) and the
document viewer ([`gallery/docx_viewer`](../../docx_viewer/README.md)) present
through the same `EVGDisplayList`, so **`common/` and the two surfaces are
already the whole of their Android port** — what is left is a facade like
`ranger/pptx_android.rgr` and a `View`. The deck went first because a viewer is
what a tablet is for, and because its input model (turn the page) is the one
that does not need a keyboard.

## Related

* [PPTX viewer](../README.md) — the model, the resolver, the oracles
* [WebGL host](../web/) — the same app in a browser
* [`gallery/evg/gl/evg-webgl.js`](../../evg/gl/evg-webgl.js) — the other
  display-list backend, and the one this painter's text placement follows
* [`gallery/datagrid/platform/sdl`](../../datagrid/platform/sdl/README.md) — the
  native desktop backend
* [`gallery/process_counter_android`](../../process_counter_android/README.md) —
  the earlier, smaller Kotlin/Android sketch
