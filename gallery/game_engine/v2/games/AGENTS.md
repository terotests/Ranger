# v2 game-package rules

A loadable TSX game is **guest content, not a host program**.

This file exists because the rule was violated in practice: a game-specific
host shell (`ylos2/ylos2_v2_runner.rgr` — interpreter setup, bridge
construction, renderer calls, host assertions) was placed inside a game
directory. The broader "engine core must stay generic" rule
(`../../AGENTS.md`) did not prevent it, because that file governed *engine
core*, not the *game package boundary*. These rules close that gap.

## The enforcement sentence

> **Adding a TSX game must not require adding or compiling a game-specific
> `.rgr` file.**

If your change to `games/<name>/` makes that sentence false, the change is
wrong — regardless of how reasonable it looks as "just a runner" or "just a
test harness".

## Hard rules

1. TSX game directories **may** contain:
   - `.tsx` guest source
   - game metadata
   - assets and data files
   - game-facing documentation

2. TSX game directories **must not** contain:
   - `.rgr` runners
   - interpreter setup
   - bridge construction
   - renderer construction
   - arena or registry inspection
   - host lifecycle loops
   - host-side assertion code

3. All TSX games run through the **same generic runtime entrypoint**
   (`../runtime/game_host/RgGameHost.rgr` — the v1 `GameRunner` analog). The
   host knows the *game protocol* (`init()` / `update(props)` / `getLayerId()`
   / `getCameraId(pane)` / optional `autopilotBits(slot)` attract mode), never
   a game.

4. Game-specific **host** tests belong under `v2/tests/` (e.g.
   `v2/tests/e2e/ylos2_e2e_test.rgr`), not under `v2/games/<name>/`. A test
   driver may be game-aware; a game directory may not be host-aware.

5. Production game source must not export test-only accessors for host
   inspection. Use guest-visible diagnostics or test fixtures where needed.
   *(Known deviation: `ylos2/index.tsx` currently exports `playerY` /
   `playerX` / `reachedGoal` / `playerSpriteId` for the e2e driver — these
   should migrate to a guest-side test fixture under `games/<name>/tests/`
   that runs through the generic host.)*

6. Adding a new TSX game must not require compiling a new `.rgr` program.

7. A game package is valid only when **copying its directory to another
   compatible host is sufficient to run it**.

## Why this matters (the v1 lesson, one level up)

v1 rotted through per-game engine growth: RGSP1 slots, runner-specific sheet
manifests, `Standard body indices (autopeli)` in the shared ABI. The v2 form
of the same disease is subtler — a "helpful" per-game `.rgr` host shell. The
package boundary is the firewall: games stay data + guest code, hosts stay
generic, and the two meet only at the game protocol and the `ranger:*`
capabilities.
