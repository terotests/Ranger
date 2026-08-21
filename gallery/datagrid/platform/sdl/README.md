# DataGrid — native SDL2 + OpenGL host (C++)

Desktop host for the EVG spreadsheet under `gallery/datagrid/`. Same portable
`GridApp` as the WebGL page; this folder owns the window, input, and **EVG →
OpenGL** present path (same seam as `gallery/evg/gl/evg-webgl.js`).

```text
.xlsx on disk
   ↓
GridApp (loadXlsx / saveXlsx / UIInput)
   ↓
EVGDisplayList
   ↓
EvgGlPainter + evg_gl_native.cpp  →  OpenGL (SDF rects, text atlas, paths)
   ↓
SDL2 window (HiDPI-aware viewport)
```

SoftCanvas is used only to rasterize **text runs into an atlas** (the WebGL host
uses Canvas2D for that). The page itself is not blitted as a bitmap — that was
what distorted on Retina.

## Window points, everywhere but the viewport

There are two coordinate spaces on a Retina screen and only one of them belongs
in the app. The page is laid out, hit-tested and projected in **window points**;
the **drawable** is twice that on a Retina display and is used for exactly two
things — the GL viewport, and the scale the text atlas is rasterized at.

SDL reports the pointer in window points, so there is nothing to convert. There
used to be a conversion anyway, dividing the pointer by the drawable ratio; on a
Retina screen that put every click half way towards the top-left corner of the
window — a couple of hundred pixels out by the middle of a spreadsheet, and
worse the further from the origin you clicked.

The window size is also asked for every frame rather than remembered from
`dgfx_open`: the size a window is created with is a request, and the corner can
be dragged afterwards. `dgfx_window_width` / `_height` call `SDL_GetWindowSize`;
`dgfx_drawable_width` / `_height` call `SDL_GL_GetDrawableSize`. They are
different numbers and mixing them is this whole class of bug.

## Opening and saving

**macOS:** the menu bar has **File → New / Open… / Save / Save As… / Quit**
(⌘N / ⌘O / ⌘S / ⇧⌘S / ⌘Q). Linux has no native app menu here; use the toolbar
or shortcuts.

| Action | How |
| --- | --- |
| New | File menu, New toolbar button, or `Ctrl/⌘+N` — blank Sheet1, no path yet |
| Open | File menu, folder toolbar button, or `Ctrl/⌘+O` — system open dialog |
| Save | File menu, Save toolbar button, or `Ctrl/⌘+S` — **overwrites** the file that was opened (or asks Save As if there is none yet) |
| Save As | File menu, Save As toolbar button, or `Ctrl/⌘+Shift+S` — system save dialog |

`GridApp` cannot open a picker — it does not know whether it is in a browser, a
window, or on the end of a socket, and each of those answers differently. So it
only says what it wants: `app.fileRequest` becomes `"open"` or `"saveAs"` and
the host reads it, does the platform's part, and clears it. Here that is a real
system dialog, asked for the way a shell script would ask — `osascript` on
macOS, `zenity` or `kdialog` on Linux — so nothing extra is linked or installed
for it. Where none of them answer, the picker returns nothing and the workbook
already open is untouched. The browser page serves the same request with the
file input it already had, so the button means the same thing in both.

On macOS the File menu is a real `NSMenu` (`dgfx_menu.mm`); choosing an item
queues an action the host drains each frame.

## The one thing the two backends do not share

The browser builds its text atlas with Canvas2D, where `clearRect` leaves the
surface transparent and `fillText` writes each glyph's coverage into **alpha**.
`SoftCanvas` has no transparent surface: `clear` writes opaque black and the
blitter keeps the destination opaque. So the native atlas has alpha 255 in every
texel, and a shader that samples alpha gives every run a coverage of 1 — each
label comes out as a solid rectangle of colour, the exact width and height of
the words that should have been there.

The coverage is real; it is in the **colour** channels. White glyphs composited
over black leave `r = g = b = coverage`, and that is what the fragment shader
reads. `EvgGlPainter.buildAtlas` paints white-on-black for exactly that reason —
the two only work together, and changing either alone breaks text.

The atlas is also rasterized at the **drawable's** scale, not the page's: a
13-pixel label on a Retina display is drawn from 26 real pixels of type rather
than 13 magnified ones. An `AtlasSlot` therefore carries two rectangles —
`x/y/dw/dh` in device pixels, which is what the UV window covers, and `w/h/pad`
in page units, which is what the quad is placed with.

```bash
npm run datagrid:gl:test
```

`buildAtlas` is plain SoftCanvas work with no native call in it, so it compiles
to JS and can be examined a pixel at a time without SDL, a GPU or a screen.
That test asserts both halves of the contract above.

## Requirements (macOS)

```bash
brew install sdl2
# Xcode / Command Line Tools for clang++ and OpenGL.framework
```

Linux: `libsdl2-dev` and `libGL` (mesa). Needs OpenGL 3.2+ core for the EVG shaders
and for the SoftCanvas blit fallback (`#version 150`). Older `#version 120`
shaders are kept only as a last-resort compile fallback.

## Build & run

From the repo root:

```bash
./gallery/datagrid/platform/sdl/build.sh
./tmp/datagrid-sdl/datagrid_sdl gallery/datagrid/fixtures/business-workbook.xlsx
```

Or via npm:

```bash
npm run datagrid:sdl
npm run datagrid:sdl:run
npm run datagrid:sdl:smoke
```

### CLI

| Arg | Meaning |
| --- | --- |
| `path.xlsx` | Open workbook from disk (default: business-workbook fixture) |
| `N` (integer) | Render N frames then exit (CI / smoke) |
| `--save` | On exit, overwrite the open file via `saveXlsxDefaultSilent` |
| `--demo` | Skip the default fixture and use the built-in demo sheet |
| `--a11y` | Print the accessibility tree once, after the first frame |

Ctrl+S inside the window also saves (same as the WebGL host).

### Headless smoke

```bash
SDL_VIDEODRIVER=dummy ./tmp/datagrid-sdl/datagrid_sdl \
  gallery/datagrid/fixtures/sales.xlsx 20
```

(No GL window under `dummy` — SoftCanvas paints the list so load/save still run.)

## VoiceOver

An OpenGL window has no accessible children. VoiceOver does not look at pixels —
it asks the platform for a tree of roles and names — so it finds one empty
rectangle where a spreadsheet is.

The app already publishes that tree for the browser page
(`GridApp.a11yJson()`, from `gallery/evg/EVGA11yTree.rgr`), so this host hands
the same JSON to `dgfx_a11y.mm`, which builds one `NSAccessibilityElement` per
node under the window's content view. Same tree, two hosts; only the last step
differs, which is the point of publishing a tree rather than teaching each
platform what a spreadsheet is.

```text
GridApp ─┬─ EVGDisplayList ─► EvgGlPainter ─► OpenGL          the picture
         └─ a11yJson()     ─► dgfx_a11y.mm ─► NSAccessibility  what it means
```

- Elements are **reused by node id**, which is what the stable ids in the tree
  are for: rebuilding the element VoiceOver is sitting on throws its cursor back
  to the top of the window, and everything still looks right on screen.
- Bounds are converted from window points (y down) to screen points (y up).
- A reader pressing something hands back a **point**, and the host presses the
  app there — the app's own hit testing decides what is there, so there is no
  second table of what each thing does.
- Nothing is built when nothing is listening: `dgfx_a11y_active()` is
  VoiceOver's own state. `DGFX_A11Y=1` forces it on (for Accessibility
  Inspector), `DGFX_A11Y=0` off.
- Focus is posted only when the app's focus actually moves. Posting every frame
  interrupts the reader mid-sentence, which is how this ends up unusable.

Trying it:

```bash
npm run datagrid:sdl
# ⌘F5 for VoiceOver, then:
./tmp/datagrid-sdl/datagrid_sdl gallery/datagrid/fixtures/business-workbook.xlsx
```

The tree itself can be looked at without a window or a screen reader, which is
also how to tell an app-side problem from a bridge-side one:

```bash
npm run datagrid:sdl:a11y     # SDL_VIDEODRIVER=dummy … --a11y
```

### When it misbehaves

Two things went wrong on the first real VoiceOver run, and both are worth
knowing about because they look like different bugs than they are.

**VoiceOver's cursor drawn outside the window.** The rectangles are in screen
coordinates, and they were computed where the window was standing at the time.
Moving the window changes none of the tree's bytes, so an optimization that
skips unchanged trees left every element behind at the old position. Geometry is
now tracked separately from content: a move re-frames the same elements without
re-parsing anything. The other half of this was the bridge *guessing* which
window the tree belonged to — right while the app is frontmost, nil when it is
not, and the fallback can hand back a window the tree was never about.
`dgfx_a11y_attach` takes the SDL window now, so there is nothing to guess.

**"Application is not responding."** That is what an accessibility client says
when a request times out, and a vsync-locked frame loop is a suspect: an AX
client works synchronously, and an app that services its run loop once per frame
can add a frame of latency to every one of a few hundred round trips. Two costs
were removed on that suspicion — the tree is rebuilt at 15 Hz rather than 60
(measured at 1.3 ms a time, `bench/a11y_bench.rgr`), and VoiceOver's own state
is asked for once a second rather than sixty times, since reading it can leave
the process. Whether that was the cause is not established.

If it happens again, the thing that settles it is a sample of the hung process —
Activity Monitor → the process → **Sample Process**, or:

```bash
sample datagrid_sdl 5 -file /tmp/dg-sample.txt
```

The main thread's stack in that file names what it was waiting for. Meanwhile
`DGFX_A11Y=0` turns the bridge off entirely, and `DGFX_A11Y_LOG=1` prints every
publish, re-frame and attach with the window's frame, which is how to tell a
stale rectangle from a wrong one.

**Still not verified here.** `dgfx_a11y.mm` was written and reviewed but never
compiled or run in this container — this container has no macOS, no AppKit and no GPU. The
Linux stub (`dgfx_a11y_stub.cpp`) and everything above it — the tree, the
operators, the host loop — do build and run here. Design, state and the wider
plan: [`gallery/evg/PLAN_ACCESSIBILITY.md`](../../../evg/PLAN_ACCESSIBILITY.md).

## Layout

| File | Role |
| --- | --- |
| `datagrid_sdl.rgr` | Host: argv → `GridApp` → frame loop |
| `EvgGlPainter.rgr` | Walk display list → `dgfx_evg_*` |
| `dgfx_a11y.h` / `.mm` / `_stub.cpp` | a11y tree → NSAccessibility (macOS), no-op elsewhere |
| `evg_gl_native.cpp` | OpenGL batcher (shaders ≈ `evg-webgl.js`) |
| `gfx_datagrid_sdl.rgr` | SDL2 window + input + operator glue |
| `build.sh` | Ranger `-l=cpp` → link SDL2 + OpenGL |

The spreadsheet core stays under `gallery/datagrid/src/`.

**A held key repeats.** `SDL_KEYDOWN` carries a `repeat` flag on the events the
OS generates while a key is held, and this host used to drop them — so holding
an arrow moved the selection exactly once, while ordinary typing in the same
build repeated normally, because `SDL_TEXTINPUT` is sent for repeats too. Both
browser hosts had always passed them through. The delay before the first repeat
and the rate after it are the OS's, which is the point of forwarding rather
than timing them here: they are a preference the user set once, in one place,
for every program on the machine.
