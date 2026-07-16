# Ranger Games on the web

Runs the Ranger game engine **compiled to JavaScript** in the browser, rendering
real games to a `<canvas>`, with a **Monaco editor + live reload**: edit a game's
script and it hot-reloads without a restart. Published to GitHub Pages under
`/games` by the [`deploy-pages`](../../../.github/workflows/deploy-pages.yml)
workflow.

Live locally:

```bash
cd gallery/game_engine/web && npm ci        # Monaco + esbuild (editor pane)
node build.mjs                              # -> ./dist
cd dist && python3 -m http.server 8000
# open http://localhost:8000
```

The editor is optional: without `npm ci` the build still emits a canvas-only
games site (it just logs "no editor").

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
- **`src/editor.entry.mjs`** — the Monaco editor, bundled by esbuild into
  `editor.bundle.js` (+ `.css` + `editor.worker.js` / `ts.worker.js`). Self-hosted,
  so the Pages site needs no CDN.
- **`index.html`** — the two-pane shell: Monaco editor + canvas, a game dropdown,
  auto-reload toggle, restart/pause.

The `GameRunner` here is the *same* one the native/SDL host and the Node smoke
test use — no engine fork.

## Live reload

The VFS is the substrate shared by the editor and the engine, so live reload
falls out of code that already exists:

1. You edit the script in Monaco.
2. `GameSession.reload(src)` writes it back into the VFS (bumping the file's
   `mtimeMs` — the same signal the engine's own hot-reload poll uses) and calls
   `WebGameHost.reloadScript(src)`.
3. That runs `GameRunner.hotReloadScript` → `engine.patchScript`, which AST-diffs
   the new source against the running program and swaps only what changed. Edits
   to `update`/`hud` keep the running game state; edits to
   `initState`/`sprites`/`consts` rebuild the scene.

No polling loop is wired in the browser today (the editor calls `reload`
directly), but the `mtimeMs` bump means an mtime-poll driver would work unchanged.

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
| **Breakout** | Multi-file script, sound effects (brick/wall/win) |

## Sound & input

- **Sound** is the engine's own synth. `WebAudioSink` (in `web_game_host.rgr`)
  captures the int16 PCM the engine hands its audio sink per `soundEvent`, and
  `runner.js` plays each buffer through the Web Audio API. Created on the first
  user gesture (autoplay policy); a Sound toggle mutes it.
- **Gamepad/joystick** — yes, the browser supports it. `runner.js` polls
  `navigator.getGamepads()` each frame (pad 0 → P1, pad 1 → P2; d-pad/left-stick
  + face buttons) and ORs it with the keyboard.

## 3D model viewer (`/games/model3d`)

A second page renders real `.glb` (glTF) models in the browser via Ranger's
host-side `model3d` pipeline — no WASM, no WebGL:

```
GLB → ModelLoader (container + accessors + embedded PNG/JPEG)
    → instantiate (entity scene + world transforms)
    → SoftRenderer3D (textured, directionally-lit, z-buffered rasteriser)
    → RGB buffer → canvas
```

- **`web_model_viewer.rgr`** — `WebModelViewer`: `load(dir,file)` / `render(w,h)` /
  `raw()` (RGB) / `setOrbit(rad)`. Compiled to `viewer.bundle.js`.
- **`src/model-viewer.js`** — rAF loop: orbit the camera, blit RGB→RGBA; drag to
  rotate, auto-spin when idle.
- **`build-model3d.mjs`** — compiles the viewer and packages a few committed GLBs
  (Duck, textured box, trees) into a stored zip mounted at their repo paths.

The GLB read goes through the same VFS-backed `require('fs')`, so the model is
just a file in the zip. Same renderer as the native build — `SoftRenderer3D`
gained only an optional `orbitYRad` field (default 0 = unchanged behaviour).

## TSX-script-driven 3D scene (games menu, `kind:"tsx3d"`)

The games dropdown also lists **"3D Scene (TSX)"** — a 3D scene *declared by a
short `.tsx` script* rather than a direct model load. It runs the Ranger
interpreter in the browser: the script's `init()` calls `addModel(...)` / `spin(...)`,
which a software scene bridge services host-side, and `SoftRenderer3D` rasterises
the result — no WASM, no WebGL.

```
index.tsx init()  →  ComponentEngine (interpreter)
   addModel("BoxTextured.glb")  →  SoftScene3dBridge  →  ModelLoader + instantiate
   spin(box, 0.6)                                        →  SoftRenderer3D → RGB → canvas
```

- **`web_tsx3d_host.rgr`** — `WebTsx3dHost` + `SoftScene3dBridge`: `loadScriptFile(dir,file)`
  runs the script's `init()`; `setOrbit` / `render(w,h)` / `raw()` / `spinRate()` /
  `sourceText()`. Compiled to `tsx3d.bundle.js`.
- **`src/tsx3d-viewer.js`** — rAF loop: advances the orbit by the script's `spin`
  rate, blits RGB→RGBA; drag to rotate. The editor pane shows the scene `.tsx`.
- **`build.mjs`** — compiles the host to `tsx3d.bundle.js`, packages the scene
  (`games/model_viewer_tsx/index.tsx` + its GLB), and adds a `kind:"tsx3d"` entry;
  `index.html` branches on it to launch `RangerTsx3d` on the shared canvas.

This is the browser twin of the native `tsx3d_sdl_runner.rgr`: the **same**
`games/model_viewer_tsx/index.tsx` runs on both — native SDL2/OpenGL on desktop,
software-rendered here. The native GL path itself is desktop-only.

## Roadmap

- **WASM game logic** — the car game (`autopeli_wasm`). The engine's `wasm_*`
  operators are stubbed in the es6 backend (`wasm_runtime.rgr`); wiring them to
  the browser `WebAssembly` API (the `games/*/tools/render.cjs` hosts are the
  reference) unlocks WASM guests in-browser.
- **3D** — ✅ host-side glTF viewer shipped (see above). Next: WebGL path for
  larger scenes; a glTF model as an entity inside a scripted game.
- **Monaco IDE** — ✅ done (editor + live reload; see above). Next: multi-file
  editing (the VFS already holds every game file), persisting edits to IndexedDB,
  and a share-a-URL button.
