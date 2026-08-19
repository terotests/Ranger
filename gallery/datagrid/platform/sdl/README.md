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
| `--save` | On exit, write beside the source via `saveXlsxDefault` |
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
