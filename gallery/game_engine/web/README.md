# Ranger Games on the web

Runs the Ranger game engine **compiled to JavaScript** in the browser, rendering
real games to a `<canvas>`. Published to GitHub Pages under `/games` by the
[`deploy-pages`](../../../.github/workflows/deploy-pages.yml) workflow.

Live locally:

```bash
node gallery/game_engine/web/build.mjs        # -> gallery/game_engine/web/dist
cd gallery/game_engine/web/dist && python3 -m http.server 8000
# open http://localhost:8000
```

## How it works

The engine is emitted for Node — it loads scripts and assets with
`require('fs').readFileSync`/`existsSync`/`statSync` and reads `process.argv`.
That whole surface is **four fs methods**, so instead of porting the engine we
give it a virtual filesystem and let it run unmodified.

```
        ┌──────────── RangerVFS (Map<path,{bytes,mtimeMs}>) ────────────┐
providers│  mountZip(storedZip)   mountManifest(json)   (later: IndexedDB)│
        └───▲───────────────────────────▲──────────────────────▲────────┘
            │ reads (scripts, PNG sheets)│ writes (editor edits)│ require('fs')
      ┌─────┴─────┐               ┌──────┴──────┐        ┌──────┴──────┐
      │  engine   │               │   Monaco    │        │  node-shim  │
      │  (→ JS)   │               │  (future)   │        │ fs/path/... │
      └───────────┘               └─────────────┘        └─────────────┘
```

- **`src/vfs.js`** — the VFS + the `require` shim. Only `readFileSync`,
  `existsSync`, `writeFileSync`, `statSync().mtimeMs` are backed. `mountZip`
  reads a *stored* (uncompressed) zip so binary assets like PNG sprite sheets
  pass through byte-exact. "Zip or database" are just providers behind one
  interface.
- **`web_game_host.rgr`** — the browser runner. Wraps `GameRunner` with the same
  wiring the native/SDL host does — crucially `setNativeBridge(...)`, without
  which a game's `createStaticBg()` background (sky, platforms) silently no-ops —
  and exposes a flat two-player `frame(...)` the JS harness drives. This is what
  `build.mjs` compiles to `engine.bundle.js`.
- **`src/engine-host.js`** — wraps the compiled engine as a factory
  `function(require, process, Buffer, ...)` so every `require('fs')` inside the
  engine resolves against the VFS. Returns the `WebGameHost` class.
- **`src/runner.js`** — a `requestAnimationFrame` loop: keyboard →
  `runner.frame(dt, up, down, left, action, right, quit)` → `runner.draw()` →
  `runner.raw()` (a `width*height*4` RGBA `ArrayBuffer`) → `putImageData`.
- **`build.mjs`** — compiles the engine to JS, strips the trailing auto-run so
  it can be instantiated on demand, and packages each game in the `GAMES`
  registry as a stored zip whose entry names are the repo-relative paths the
  engine hardcodes (so nothing needs rewriting).
- **`index.html`** — the shell: a game dropdown, the canvas, restart/pause.

The `GameRunner` here is the *same* one the native/SDL host and the Node smoke
test use — no engine fork.

## Adding a game

Append an entry to `GAMES` in `build.mjs`:

```js
{
  id: "mygame",
  title: "My Game",
  kind: "ranger",                 // pure-Ranger TS game logic
  width: 480, height: 270,
  scriptDir: "gallery/game_engine/games/mygame",
  script: "index.tsx",
  package: [                      // repo-relative; PNG/asset files welcome
    "gallery/game_engine/games/mygame/index.tsx",
    "gallery/game_engine/scripting/game_helpers.tsx",
    "gallery/game_engine/games/mygame/assets/hero.png",
  ],
  controls: "WASD to move.",
}
```

To find a game's exact file set, drive its script through `GameRunner` with a
VFS that falls back to real disk and logs reads (see the probes used while
building this).

## Current games

| Game | Demonstrates |
|------|--------------|
| **Pong** | Pure-Ranger game logic, text-only package |
| **Ylos 2 (Pomppija)** | PNG sprite-sheet loading (binary VFS path), split-screen |

## Roadmap

- **WASM game logic** — the car game (`autopeli_wasm`). The engine's `wasm_*`
  operators are stubbed in the es6 backend (`wasm_runtime.rgr`); wiring them to
  the browser `WebAssembly` API (the `games/*/tools/render.cjs` hosts are the
  reference) unlocks WASM guests in-browser.
- **GPU / 3D demo** — `cube3d_wasm` style host-side rasterisation, then WebGL.
- **Monaco IDE** — the VFS already tracks `mtimeMs`, and the engine already
  hot-reloads scripts by polling it, so an editor that writes edits into the VFS
  gets live reload for free.
