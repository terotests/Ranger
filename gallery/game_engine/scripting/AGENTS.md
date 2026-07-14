# `scripting/` is Ranger engine code + tests — NOT the game catalog

Read this before adding files here.

Everything in `gallery/game_engine/scripting/` is one of:

- **Engine library modules** — `game_*.rgr` imported by the runtime
  (e.g. `game_runtime.rgr`, `game_audio.rgr`, `game_vocal_fx.rgr`).
- **Ranger test fixtures** — loose `*.game.tsx` scripts used by headless
  runners to exercise the interpreter (e.g. `vocal_fx_demo.game.tsx`).
- **Headless smoke runners** — `*_runner_demo.rgr` / `*_selftest.rgr` that
  compile to JS and are driven by `npm run engine:*` scripts.

**These are not playable games and they do not appear in the launcher menu.**
The launcher (`menu/`, `game_catalog.rgr`) only scans **game folders**:

```
gallery/game_engine/games/<name>/
    game.info        # name=…  category=Games|Tests  soloScript=index.tsx | module=logic.wasm | game.as
    index.tsx        # or a .as / .wasm module
    assets/…
```

## Rule for AI agents (and humans)

Do **not** drop a new playable game in `scripting/` as a loose `*.game.tsx`
or `*_runner_demo.rgr`. That is a recurring mistake — such files never show up
in the menu and clutter the engine/test directory.

To add a real, launchable game, create a folder under
`gallery/game_engine/games/<name>/` with a `game.info` and a `.tsx` / `.as` /
WASM module. See `games/pinpall/` (a `.tsx` game) or `games/physics_sandbox/`
for a template.

A loose `*.game.tsx` here is only appropriate as a **test fixture** for a
headless runner, and it should say so at the top of the file. The playable copy
still belongs under `games/`.
