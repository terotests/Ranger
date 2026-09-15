# CodeGraph SDL2 host

The Full EVG explorer in a desktop window. Same `CodeGraphApp` as the web
page: gallery/ui chrome, RangerFlow canvas, VirtualCompiler against an
in-memory filesystem.

**License: AGPL-3.0-or-later**

```bash
npm run codegraph:sdl
./tmp/codegraph-sdl/codegraph_sdl
./tmp/codegraph-sdl/codegraph_sdl gallery/codegraph/fixtures/calls.rgr
SDL_VIDEODRIVER=dummy npm run codegraph:sdl:smoke
```

Open a `.rgr` from the File menu or the **Open** toolbar button. The host
walks `Import` from that file (including `../css` / `../evg` style paths),
rewrites those to basenames, and installs the closure in the VFS.
`compiler/`, `lib/`, and the gallery css/evg/zip samples are loaded from the
repo into the same VFS at start.

macOS: needs SDL2 (`brew install sdl2`). Escape closes an open picker list,
then the window.
