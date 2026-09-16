# CodeGraph SDL2 host

The Full EVG explorer in a desktop window. Same `CodeGraphApp` as the web
page: gallery/ui chrome, RangerFlow canvas, VirtualCompiler against an
in-memory filesystem.

**License: AGPL-3.0-or-later**

```bash
npm run codegraph:sdl
./tmp/codegraph-sdl/codegraph_sdl
./tmp/codegraph-sdl/codegraph_sdl gallery/codegraph/fixtures/calls.rgr
./tmp/codegraph-sdl/codegraph_sdl gallery/uast/fixtures/cpp/zip_writer.hpp
./tmp/codegraph-sdl/codegraph_sdl https://github.com/org/repo.git
SDL_VIDEODRIVER=dummy npm run codegraph:sdl:smoke
```

**Open** picks a `.rgr` / `.h` / `.hpp` / `.cc` / `.cpp` / `.ts` / `.tsx` /
`ranger.json`. **Git URL** (toolbar) prompts for an HTTPS repository, clones
it with `gallery/pkg` (`clone.mjs`), then analyses Ranger, C++ (UAST `fromDir`
when the tree has headers/sources and no TypeScript), or TypeScript.
A Git URL as the command-line argument does the same clone. The example
menu **cpp — ZipWriter** opens `gallery/uast/fixtures/cpp/zip_writer.hpp`
from disk (run the binary from the repo root).

Needs `node` on PATH. First Git URL clone builds `gallery/pkg/bin/pkg_tool.js`
if it is missing. Run the binary from the repo root.

macOS: needs SDL2 (`brew install sdl2`). Escape closes an open picker list,
then the window.
