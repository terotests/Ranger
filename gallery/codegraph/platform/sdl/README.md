# CodeGraph SDL2 host

The Full EVG explorer in a desktop window. Same `CodeGraphApp` as the web
page: gallery/ui chrome, RangerFlow canvas, VirtualCompiler against an
in-memory filesystem.

**License: AGPL-3.0-or-later**

```bash
npm run codegraph:sdl
./tmp/codegraph-sdl/codegraph_sdl
./tmp/codegraph-sdl/codegraph_sdl gallery/codegraph/fixtures/calls.rgr
./tmp/codegraph-sdl/codegraph_sdl https://github.com/org/repo.git
SDL_VIDEODRIVER=dummy npm run codegraph:sdl:smoke
```

**Open** picks a `.rgr` / `.ts` / `.tsx` / `ranger.json`. **Git URL** (toolbar)
prompts for an HTTPS repository, clones it with `gallery/pkg` (`clone.mjs`),
then analyses Ranger (`ranger.json` / `.rgr`) or TypeScript (UAST `fromDir`).
A Git URL as the command-line argument does the same clone.

Needs `node` on PATH and a built `gallery/pkg/bin/pkg_tool.js`
(`npm run pkg:tool` once). Run the binary from the repo root.

macOS: needs SDL2 (`brew install sdl2`). Escape closes an open picker list,
then the window.
