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

Linux: `libsdl2-dev` and `libGL` (mesa). Needs OpenGL 3.2+ core for the EVG shaders.

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

Ctrl+S inside the window also saves (same as the WebGL host).

### Headless smoke

```bash
SDL_VIDEODRIVER=dummy ./tmp/datagrid-sdl/datagrid_sdl \
  gallery/datagrid/fixtures/sales.xlsx 20
```

(No GL window under `dummy` — SoftCanvas paints the list so load/save still run.)

## Layout

| File | Role |
| --- | --- |
| `datagrid_sdl.rgr` | Host: argv → `GridApp` → frame loop |
| `EvgGlPainter.rgr` | Walk display list → `dgfx_evg_*` |
| `evg_gl_native.cpp` | OpenGL batcher (shaders ≈ `evg-webgl.js`) |
| `gfx_datagrid_sdl.rgr` | SDL2 window + input + operator glue |
| `build.sh` | Ranger `-l=cpp` → link SDL2 + OpenGL |

The spreadsheet core stays under `gallery/datagrid/src/`.
