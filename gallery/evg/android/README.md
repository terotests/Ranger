# `gallery/evg/android` — EVG's display list, on Android and on a JVM

The backend the Android ports share: an `EVGDisplayList` in, `android.graphics`
or Java2D out. No app lives here, and neither does any knowledge of one.

```text
   EVGDisplayList                    ← eight command kinds, absolute pixels,
        │                              resolved colours. Whoever built it.
        ▼
   EvgPainter                        ← the walk. Written once.
        │
        ├── AndroidEvgSurface        android.graphics.Canvas   ← the app
        ├── AwtEvgSurface            java.awt.Graphics2D       ← the checks
        └── RecordingSurface         a tally, then one of the above
```

| Path | What it is |
| --- | --- |
| `src/main/kotlin/…/EvgSurface.kt` | The eight things a backend has to draw |
| `src/main/kotlin/…/EvgPainter.kt` | Display list → surface calls |
| `src/main/kotlin/…/RecordingSurface.kt` | Counts what the painter dispatched, so coverage is a number |
| `src/android/kotlin/…/AndroidEvgSurface.kt` | `android.graphics` implementation, plus `FaceSet` and `ImageStore` |
| `src/android/kotlin/…/RippleEffect.kt` | `evg-surface-effect: ripple` as an AGSL post-process (API 33+) |
| `src/awt/kotlin/…/AwtEvgSurface.kt` | The same surface on Java2D, so a port is testable without a device |
| `androidstubs/` | Platform declarations, so a host type-checks with no SDK installed |

## Why it is source, not a library

A port compiles these files into its own build. That is not laziness about
publishing a `.aar`: the painter has to name the generated `EVGDisplayList`
type, and every port generates its own copy of EVG by compiling its own Ranger
tree. So the one thing the ports agree on is the **package** that generated code
goes into — `fi.ranger.rgr` — and the painter imports
`fi.ranger.rgr.EVGDisplayList` from there. Two apps, two compilations, one
import line, and no serialisation boundary in between.

Each port's `scripts/build-ranger.sh` puts that `package` line at the top of the
file the compiler wrote.

## Who uses it

* [`gallery/pptx/android`](../../pptx/android/README.md) — the slide viewer.
  Adds `TouchRouter`, a `SlideView` and the four bundled faces a deck was
  measured with.
* [`gallery/ui/android`](../../ui/android/README.md) — the dashboard demo. Adds
  a viewport facade and a `DashboardView`, and draws with the platform's own
  sans because that is what the page was laid out against.
* [`gallery/realtrainer/android`](../../realtrainer/android/README.md) — the
  RealTrainer demo. The page is the view rather than a fitted document, and
  the host adds the soft keyboard through an `InputConnection`; the stubs
  under `androidstubs/InputMethod.kt` are its.

All three are a facade in Ranger plus a `View`. That is the claim this directory
exists to make good on: the seam is the display list, so a new host is a page of
delegation rather than a second renderer.

## The one thing that is not a surface

`evg-surface-effect: ripple` is not a draw command and cannot be: it is a pass
over the finished pixels. `RippleEffect` is that pass on Android — the display
list's `effectKind` and its dozen `effect*` numbers, handed to a `RuntimeShader`
through `RenderEffect.createRuntimeShaderEffect`, which is the same stage
`evg-webgl.js` runs its own version in. It is a translation of that shader, not
a second one; API 33 and later, a no-op below.

## Scroll layers, and what this painter does not do yet

A clip that can scroll arrives with `layer` set on its PUSH_CLIP — see
`EVGDisplayList.refreshLayers`. An app that keeps its list across a scroll
hands the painter the SAME list, with the commands inside that clip already
moved to where the scroll put them, so `EvgPainter.paint` draws the right
frame without knowing a layer from any other clip. What the host saves is
the layout and the list build; what it still pays is rasterising every
command in the layer, every frame.

The next step, when a long page on a device asks for it, is the one the
browser painter took: keep what was made from the layer. Here that is a
`Bitmap` the size of the layer's range, painted once per `buildSeq` through
a `Canvas` over it, and drawn per frame at the layer's clip with
`layerShiftX/Y` subtracted from the shift it was painted at — a scroll
frame is then one `drawBitmap` under the clip and the commands outside the
layer. The list's `layerFirst`/`layerLast` give the command range; nothing
else in the list has to change.

## What the surfaces do not agree on

Both honour clipping and multi-ring even-odd paths, which the software
rasteriser drops. They differ in one place, and it is a platform fact rather
than a choice: a hardware-accelerated `Canvas` ignores `BlurMaskFilter`, so
`AndroidEvgSurface` **draws** a shadow's falloff — the silhouette a few times,
each pass grown and fainter — while `AwtEvgSurface` filters it. See the comment
on `canBlur`.

**License: AGPL-3.0-or-later** (Gallery).
