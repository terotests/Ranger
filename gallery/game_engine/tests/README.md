# `tests/` — game-engine headless test runners

Headless Ranger test runners for the game engine. They compile to JS/native and
assert on game state — no window, no launcher.

| Group | Files | Driven by |
|-------|-------|-----------|
| **Per-game smoke runners** | `pong_runner_demo.rgr`, `pacman_runner_demo.rgr`, `invaders_runner_demo.rgr`, `breakout_runner_demo.rgr`, `ylos_runner_demo.rgr`, `ylos2_runner_demo.rgr`, `ylos3_runner_demo.rgr`, `spawner_runner_demo.rgr`, `counter_runner_demo.rgr`, `world_scroll_runner_demo.rgr` | `tests/game-runner.test.ts`, `tests/ts-to-ranger-host.test.ts`, and `npm run engine:pong:runner` / `engine:spawner:runner` |
| **Interpreter fixtures** | `interp/` | interpreter/`.as` language tests |

Each per-game runner imports the engine core from `../scripting/game_runtime.rgr`
and loads its game script through the interpreter. The game scripts themselves
(`*.game.tsx`) stay in [`../scripting/`](../scripting/): they are a **shared
input** — the same file feeds the `.d.ts` type graph (`tsconfig.json`), the
watch/build scripts, and the AOT native games in [`../ranger_games/`](../ranger_games/)
— so the runners read them by repo-root path rather than owning a copy.

Where things live (see also the top-level [`../README.md`](../README.md)):

- **Loadable games** → [`../games/`](../games/)
- **Static-Ranger games** (compiled to native) → [`../ranger_games/`](../ranger_games/)
- **Engine core** + engine-subsystem smoke runners → [`../scripting/`](../scripting/)
- **Game test runners** → here

```bash
npm run engine:pong:runner       # compile + run pong smoke runner (180 frames)
npm run engine:spawner:runner    # compile + run spawner smoke runner (30 frames)
```
