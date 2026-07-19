# games — selected titles on the v2 API

Re-implemented sketches / ports that target **only** v2 modules:

`ranger:core` / `ranger:2d` / `ranger:three` / `ranger:cannon`  
(or `ranger_wasm::{core,two_d,three,cannon}`).

**Runnable legacy (current).** Top-level [`../../games/`](../../games/) and
the v1 engine paths they need (`scripting/game_sprite.rgr`, runners, …) stay
launchable — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md)
(**Intent** / runnable → archival). Ports here do **not** flip the tree to
archival legacy or license deleting that runtime.

Sketches may not compile until façades exist. Comments mark `MISSING` /
`TODO` / `HACK` where the API or content is incomplete.

**Plan phase:** 12 (sketches may land earlier).

## Policy

1. **New folder, old tree kept and launchable.** Ports live under
   `v2/games/<name>/`. Top-level `games/` is **not deleted** and must keep
   working on v1.
2. **Select, don’t bulk-move.** Prefer high-signal titles — especially
   **must-pass** kids’ favorites below.
3. **Copy or rewrite by maturity.** Pure TS rules/AI (e.g. chess) copy across;
   GameRunner shells rewrite to `runtime.start(Game)`.
4. **No v1 engine imports** inside v2 game code.

## Must-pass port targets

These exercise more of the 2D + core surface than tiny demos. A Phase 12
“2D done” claim is false until both work on v2 **without** regressing v1.

| v1 source | Why must-pass | v2 needs |
|-----------|---------------|----------|
| **`games/chess`** | Sheet pieces + EVG/JSX HUD; rules/AI are pure TS (copy unchanged) | `SpriteAtlas` / `Sprite2D`, `ranger:2d` text + staged EVG, action maps / cursor |
| **`games/ylos2`** | LPC sheets, bitmap diamonds, camera scroll, particles, rumble, **split-screen**, **vocal FX**, **music score** | `ranger:2d` + **surface panes**, **`runtime.audio.vocal` / `.music`**, particles, rumble |

Until split-screen / vocal / music land in `ranger:core`, ylos2 can be
partially sketched but is **not** a green must-pass.

## Selection (sketches + targets)

| v1 source | v2 path | Strategy | Status |
|-----------|---------|----------|--------|
| **`games/chess`** | `chess/` (TODO) | **must-pass** — copy rules/AI; rewrite shell | pending |
| **`games/ylos2`** | `ylos2/` (TODO) | **must-pass** — atlas + panes + vocal/music | pending (blocked on core gaps) |
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
- **Must-pass:** chess + ylos2 playable on v2; v1 chess + ylos2 still launch
- No `ThreeTsxBridge.reconcile` / v1 `three/tsx` imports in v2 ports
- D-LIFE shutdown paths (remove ≠ release; shared atlas retains)

---

*Sketches only until engine phases land; v1 remains the playable stack.*

---

## Progress — games are TSX-only folders (generic host live)

The must-pass ylos2 port runs from this folder as **pure TSX content**
(`ylos2/index.tsx` on the `ranger2d.tsx` façade). There is **no per-game
`.rgr`**: `../runtime/game_host/RgGameHost.rgr` is the one generic host (v1
GameRunner analog) — adding a new v2 game means adding a game folder with
`index.tsx`, nothing else. A game imports the REAL virtual packages
(`import { runtime } from "ranger:core"`, `import * as TWO from "ranger:2d"`),
defines a class with `init()` / `update(props)`, and calls
`runtime.start(new MyGame())` — no ambient façade globals, no concatenation.
Host lifecycle protocol: `__rgGameInit` / `__rgGameUpdate` (provided by
ranger:core, not authored per game). Assets load from package data via
`runtime.assets.loadSpriteAtlas("pkg://player.atlas")` (host resolves inside
the package; filesystem paths never cross). The GAME owns its render calls:
`renderer.render(scene, camera, pane)` each update binds a pane's view (real
handles in host pane state); the presenter reads pane state and picks the
backend. Optional `autopilotBits(slot)` attract mode is consumed by the
separate `RgAttractDriver`, never by the host. Guest-side test observations
live in `games/<name>/tests/probe.tsx` fixtures loaded through the host's
fixture door — production sources export none (rule 5 satisfied).
E2E gates: `../tests/e2e/ylos2_e2e_test`, `../tests/e2e/launcher_e2e_test`.
