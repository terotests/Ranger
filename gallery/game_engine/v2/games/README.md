# games — selected titles on the v2 API

Re-implemented sketches that target **only** v2 modules:

`ranger:core` / `ranger:2d` / `ranger:three` / `ranger:cannon`  
(or `ranger_wasm::{core,two_d,three,cannon}`).

They are **not expected to compile** until the registry and façades exist.
Comments mark `MISSING` / `TODO` / `HACK` where the API or content is incomplete.

**Plan phase:** 12 (sketches may land earlier) — see
[`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Policy

1. **New folder, old tree kept.** Ports live under `v2/games/<name>/`.
   Top-level [`../../games/`](../../games/) is **not deleted**.
2. **Select, don’t bulk-move.** Prefer small high-signal titles.
3. **Copy or rewrite by maturity.** These ports are mostly **rewrites** onto
   `runtime.start(Game)` (v1 used GameRunner `sprites()` / Three `window` loops).
4. **No v1 engine imports.**

## Selection

| v1 source | v2 path | Strategy | Status |
|-----------|---------|----------|--------|
| `games/pong` | [`pong/`](./pong/) | rewrite → `ranger:2d` shapes + action maps | sketch |
| `games/breakout` | [`breakout/`](./breakout/) | rewrite → retained bricks | sketch |
| `games/invaders` | [`invaders/`](./invaders/) | thin rewrite; bitmap art TODO | sketch |
| `games/pacman` | [`pacman/`](./pacman/) | thin maze only (not full level pack) | sketch |
| `games/sprite_char` | [`sprite_char/`](./sprite_char/) | atlas/AnimationPlayer (TS + Rust); not RGSP1 | sketch |
| `games/cube` | [`cube/`](./cube/) | rewrite → `ranger:three` + `runtime.start` | sketch |
| `games/teapot` | [`teapot/`](./teapot/) | slim lit teapot; GUI/OrbitControls TODO | sketch |
| `games/cannon_stack` | [`cannon_stack/`](./cannon_stack/) | `ranger:2d` + `ranger:cannon` dual handles | sketch |

## Conventions used in sketches

```ts
import { runtime, type Game, type FrameInfo } from "ranger:core"
import * as TWO from "ranger:2d"       // or THREE / CANNON
class MyGame implements Game {
  async init(): Promise<void> { /* … */ }
  update(frame: FrameInfo): void { /* … */ }
  resize?(w: number, h: number): void { /* … */ }
  shutdown?(): void { /* … */ }
}
runtime.start(new MyGame())
```

Comment markers:

| Marker | Meaning |
|--------|---------|
| `MISSING:` | API / asset / system not in the contract yet or not wired |
| `TODO:` | Known follow-up for a fuller port |
| `HACK:` | Temporary assumption (units, hybrid vectors, 2D Cannon plane) |
| `NOT` | Explicitly rejected v1 pattern (`window`, RGSP1 slots, reconciler) |

## Unit / contract tests (later)

- Headless smoke per game once façades exist
- No `ThreeTsxBridge.reconcile` / v1 `three/tsx` imports
- D-LIFE shutdown paths (remove ≠ release; shared atlas retains)

---

*Sketches only — engine Phase 1–10b must land before these build.*
