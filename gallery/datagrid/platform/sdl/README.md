# DataGrid — native SDL2 + OpenGL host (C++)

Desktop host for the EVG spreadsheet under `gallery/datagrid/`. Same portable
`GridApp` as the WebGL page; this folder only owns the window, input, and
present path.

```text
.xlsx on disk
   ↓
GridApp (loadXlsx / saveXlsx / UIInput)
   ↓
SoftCanvas RGBA
   ↓
OpenGL texture blit (gfx_datagrid_sdl.rgr) → SDL2 window
```

## Requirements (macOS)

```bash
brew install sdl2
# Xcode / Command Line Tools for clang++ and OpenGL.framework
```

Linux: `libsdl2-dev` and `libGL` (mesa).

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
npm run datagrid:sdl:smoke   # headless dummy driver, 20 frames
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

## Layout

| File | Role |
| --- | --- |
| `datagrid_sdl.rgr` | Host: argv → `GridApp` → frame loop |
| `gfx_datagrid_sdl.rgr` | SDL2 window + OpenGL present + mouse/keys/text |
| `build.sh` | Ranger `-l=cpp` → `clang++`/`g++` + SDL2 + OpenGL |

The spreadsheet core stays under `gallery/datagrid/src/`; do not put app logic
in this platform folder.
