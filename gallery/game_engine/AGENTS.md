# Agent guidelines — game engine

Notes for AI agents (and humans) working under `gallery/game_engine/`.
Complements the repo-root [`AGENTS.md`](../../AGENTS.md) (git/PR workflow).

The engine's whole point is **write game logic once, run it on many backends**
(Mac/SDL, native Pi, WASM Path C, interpreted `.as`). That only holds if the
*engine core* stays free of any single game's knowledge. It has not — see
[`docs/PLAN_PHYSICS_RUNNER_GENERIC.md`](./docs/PLAN_PHYSICS_RUNNER_GENERIC.md).
These rules exist to stop the leak from getting worse and to guide the cleanup.

## The abstraction boundary (read this before editing engine core)

Think of three layers. Code belongs to exactly one:

| Layer | Lives in | May know about | May NOT know about |
|-------|----------|----------------|--------------------|
| **Engine core** | `scripting/` runtime files, `framebuffer.rgr`, ABI helpers, generic runners | Framebuffers, the ABI *shape*, physics primitives, sprite/HUD *mechanisms* | Any specific game: its entities, world size, track, sprites, HUD gauges, sound names, player count |
| **Reusable subsystems** | `physics/`, `lpc/`, `menu/`, `ui/`, `pose/` | Their own domain (physics bodies, spritesheets, UI trees) | Which game is using them |
| **A game** | `games/<name>/`, the game's WASM/`.as`/TSX guest, and any `<Name>Setup`/`<Name>Render`/`<Name>Hud` modules | Everything about itself | Nothing needs to know about it in core |

### Hard rules

1. **No game name in the engine core.** A file under `scripting/` that is meant
   to be a generic runtime (anything a *second* game would reuse) must not
   `Import`, reference, or hardcode a specific game. Concretely: **no identifier
   or string containing `autopeli`, `pong`, `pacman`, `invaders`, `breakout`, …
   in a generic core file.** If you're typing a game's name into a core file,
   stop — it belongs in that game's module or must come through an interface.

2. **The guest owns its world.** For WASM/`.as`/host-physics games, the scene
   (bodies, bounds, camera policy, background, sprite mapping, HUD, event and
   contact vocabulary) is the *guest's* data. The host reads it through the ABI
   or a per-game provider; the host must not re-hardcode a copy. Never encode the
   same world in two places (the current autopeli bug — the road lives in both
   `wasm_autopeli_setup.rgr` and `rust_autopeli/src/lib.rs`).

3. **Generalize by parameter or interface, not by branch.** When the core needs
   behavior that differs per game, add a parameter, a data field, or a provider
   method — never an `if (game == "…")` branch or a hardcoded constant that only
   one game's numbers satisfy (world height `6000`, camera `5860`, id prefixes
   `t`/`c`/`b`, sound ids `wall`/`bounce`/`win`, `resolvePlayerCount → 2`, …).

4. **The shared ABI stays game-neutral.** `wasm/wasm_game_abi.h` and
   `scripting/wasm_abi_io.rgr` define a *transport*. Body-index meaning, id-code
   ranges, and event sub-ids are **conventions the guest defines** — document
   them as such. Do not freeze one game's taxonomy into the ABI header as if it
   were the standard (it currently says `Standard body indices (autopeli)`).

### Before you commit an engine-core change — checklist

- [ ] No game name (`autopeli`, `pong`, …) appears in a generic `scripting/` file.
- [ ] No world constant that only one game satisfies is hardcoded in core.
- [ ] Per-game behavior arrives via a parameter/field/provider, not a branch.
- [ ] A hypothetical *second* physics game could use this file unchanged.
- [ ] If you touched the ABI, its comments describe a convention, not one game.

### Quick self-check (grep)

A generic runtime file should return nothing here:

```bash
# Run from repo root. Any hit in a file that is supposed to be generic core
# is a leak to fix (or to route through the game's provider).
grep -rniE 'autopeli|\bpong\b|pacman|invaders|breakout' \
  gallery/game_engine/scripting/wasm_physics_runner.rgr \
  gallery/game_engine/scripting/game_runtime.rgr
```

When adding a new game, put its `*Setup`/`*Render`/`*Hud`/scene code under
`games/<name>/` (or a clearly game-named module), and wire it to the core
through the scene-provider interface — not by importing it from a core runner.
