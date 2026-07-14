# `scripting/` is Ranger engine core + tests — NOT games

Read this before adding files here.

`scripting/` is the **engine core**: the platform the games run on. Games live
elsewhere. Know the three-way split before adding anything:

| Put it in… | If it is… |
|------------|-----------|
| [`../games/<name>/`](../games/) | a **loadable** game (TSX / `.wasm` / `.as`) the launcher runs at runtime |
| [`../ranger_games/`](../ranger_games/) | a **static-Ranger** game: logic in `.rgr`, compiled to a native binary (hand-written Pong, or an AOT `*_native_game.rgr` emitted from TSX) |
| **`scripting/`** (here) | **engine core** only — see the list below |

> The AOT native games (`*_native_game.rgr`, `*_native_sdl_runner.rgr`) used to
> live here. They moved to [`../ranger_games/`](../ranger_games/). The reusable
> **native host** they call (`native_game_bridge.rgr`, `game_sdl_native_host.rgr`,
> `game_native_runtime.rgr`) is engine core and stays here.

Everything in `gallery/game_engine/scripting/` is one of:

- **Engine library modules** — `game_*.rgr` imported by the runtime
  (e.g. `game_runtime.rgr`, `game_audio.rgr`, `game_vocal_fx.rgr`), plus the
  native/WASM/sprite host runners.
- **Ranger test fixtures** — loose `*.game.tsx` scripts used by headless
  runners to exercise the interpreter (e.g. `vocal_fx_demo.game.tsx`). These
  stay here even for games whose smoke runner moved to `../tests/`, because the
  same `.game.tsx` is also a shared input to the `.d.ts` type graph
  (`tsconfig.json`, `engine.d.ts`), the watch/build scripts, and the AOT native
  games in `../ranger_games/` — the runners read them by repo-root path.
- **Engine-subsystem smoke runners** — `*_runner_demo.rgr` / `*_selftest.rgr`
  for engine core (audio, UI, physics, catalog, wasm, background…) that compile
  to JS and are driven by `npm run engine:*`. These exercise the *runtime*, so
  they live next to it.

> The **per-game** smoke runners (`pong`/`pacman`/`invaders`/`breakout`/`ylos`/
> `ylos2`/`spawner`/`counter`/`world_scroll`_runner_demo.rgr) moved to
> [`../tests/`](../tests/). Their `.game.tsx` fixtures stayed here (shared input,
> see above); the runners read them via a repo-root path.

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
