# RangerFlow — native SDL2 + OpenGL host

The same `FlowEditor` the browser page drives, in a desktop window. Nothing in
the editor knows which of the two it is running in:

```text
SDL event  → FlowInput → FlowEditor              (this process)
FlowView   → EVGDisplayList → EvgGlPainter → OpenGL
```

That is the whole point of the display-list seam. `gallery/evg/gl/evg-webgl.js`
draws the list in a browser tab and `EvgGlPainter` + `evg_gl_native.cpp` draw
the same list in a window, from the same commands, with no second copy of the
tree walk in between.

```bash
npm run rangerflow:sdl          # Ranger → C++ → native binary
npm run rangerflow:sdl:run      # …and open the window on the fixture schema
npm run rangerflow:sdl:smoke    # …or 30 frames headless, for CI

./tmp/rangerflow-sdl/rangerflow_sdl my-schema.sql
```

Requirements: a C++17 compiler, SDL2 (`brew install sdl2` /
`apt-get install libsdl2-dev`), and OpenGL (system framework on macOS, mesa on
Linux).

## Keys

| | |
| --- | --- |
| drag | pan the canvas, or move the node under the pointer |
| wheel | zoom at the cursor |
| shift-drag | rectangle selection |
| `f` | fit the graph to the window |
| `l` | switch layout: layered ⇄ force (d3, live) |
| `n` | notation: crow's foot → UML → plain |
| `e` | edge type: smoothstep → step → bezier → straight |
| `t` `g` `m` | theme · background variant · minimap |
| `a` `z` `y` | select all · undo · redo |
| `s` | write the diagram to `out/rangerflow-sdl.svg` |
| `Delete` | remove the selection |
| `Esc` / `q` | quit |

The shortcuts are bare letters rather than Ctrl combinations because a window
on Linux does not reliably receive a text event while Ctrl is held, and a demo
whose keys silently do nothing is worse than a demo with simpler keys.

## The window is the DataGrid's

`gfx_datagrid_sdl.rgr`, `EvgGlPainter.rgr` and `evg_gl_native.cpp` live under
`gallery/datagrid/platform/sdl/` and are imported from there. The `dgfx_*`
layer is generic SDL2 plumbing — window, input, GL present — that happens to
have been written for the spreadsheet first, and a second copy of it would be a
second thing to keep correct.

Two honest consequences:

* **`EvgGlPainter` takes an image cache**, because the spreadsheet it was
  written for draws photographs. A schema diagram has none, so the host passes
  an empty `GridImages` — and, through that one parameter, links a good deal of
  the DataGrid it never calls.
* **Where this ought to live** is `gallery/evg/gl/`, beside `evg-webgl.js`,
  with the image lookup behind a small interface so neither app has to know
  about the other. That is a refactor of a working host and has not been done;
  it is the first thing to do here.

## What has been verified

On this container, with `libsdl2-dev` and mesa installed:

* Ranger → C++ compiles clean (`-l=cpp`, ~5 s).
* `g++ -std=c++17` links it against SDL2 and libGL into a 1.5 MB binary.
* The binary runs: it reads `fixtures/ecommerce.sql`, parses 9 tables and 10
  foreign keys, lays them out and executes frames — headless under
  `SDL_VIDEODRIVER=dummy`, and with a real OpenGL context under `Xvfb` and
  llvmpipe.

What has **not** been verified here is the picture. This container has no
display and no compositor, so no screenshot of the native window was captured;
`xwd -root` under a bare `Xvfb` comes back black. The GL path itself is the
DataGrid's, which is exercised by `npm run datagrid:sdl`, but "RangerFlow draws
correctly through it" is a claim this machine cannot make. Run it on a desktop
and look.
