# PLAN — De-autopeli-fy `WasmPhysicsRunner` (make the physics host generic)

> Status: proposed. Companion guardrails: [`../AGENTS.md`](../AGENTS.md).
> Goal: `WasmPhysicsRunner` is placed as engine *core* (`scripting/`), but it is
> in practice **the autopeli game**. This plan catalogues the leaks, defines the
> target boundary, and gives a phased migration that keeps every game runnable at
> each step — while also fixing the games so they carry their own world.

---

## 1. Why this matters

The engine promise is *write logic once, run on many backends*. The WASM/`.as`
"Path C" host is supposed to be the generic piece that any physics game plugs
into. Today `loadWasmAt` / `loadAsAt` build a `WasmPhysicsRunner`, call
`setupScene()`, and get **the autopeli road, cars, cones, bars, oil, 2-player
split, and racing HUD** regardless of which guest module was loaded. A second
top-down physics game cannot reuse this host without deleting autopeli code.

Worse, the autopeli world is **hardcoded in two places at once**:

- Host: `wasm_autopeli_setup.rgr` → `setupPhysics()` builds the full body list.
- Guest: `wasm/rust_autopeli/src/lib.rs` → `init()` + `road_at()` + `TRAFFIC[]`
  build the same world independently.

They agree only by convention (body count, ordering, road curve). Change one and
the other silently disagrees. The world must have a single owner.

---

## 2. Leak catalogue (concrete)

All line numbers are approximate anchors at time of writing.

### 2.1 `scripting/wasm_physics_runner.rgr` — the core file that is really autopeli

| Kind | Location | Leak |
|------|----------|------|
| Import | top | `Import "./wasm_autopeli_setup.rgr"`, `Import "./wasm_autopeli_render.rgr"` — core depends on game modules |
| Field | `setup:WasmAutopeliSetup`, `render:WasmAutopeliRender` | Core owns concrete autopeli types |
| Field | `assetsDir "gallery/game_engine/games/autopeli_wasm"` | Hardcoded game asset path |
| Field | `worldH 6000`, `camSmoothP2 5860.0`, `camViewP2 5640` | Autopeli track dimensions/start line |
| `spriteFor()` | id prefix → `trafficCar`/`cone`/`bar`/`oil` | Autopeli entity taxonomy |
| `contactBodyCode()` / `bodyCodeToId()` | `L`/`R` walls, `c`/`b`/`t`, `p1`/`p2` | Autopeli id ↔ ABI-code encoding |
| `playerOnOil()` | oil-patch hazard | Autopeli-only mechanic |
| `drainEventsFromAbi()` | sound ids `wall`/`bounce`/`win`, sparkle particles | Autopeli event vocabulary |
| `drawHudOn()` | speed / progress-to-6000 / hits / grip / oil / air gauges | Autopeli racing HUD |
| `resolvePlayerCount() → 2` | fixed 2 players | Autopeli split-screen |
| `setupScene()` | calls `setup.setupPhysics(...)` + `assetsDir` | Builds the entire autopeli scene |
| `smoothCamTarget()` | follow `p1`/`p2`, target `5860` | Autopeli camera |

### 2.2 `wasm/wasm_game_abi.h` — one game's taxonomy frozen into the shared ABI

- `/* Standard body indices (autopeli) */` with `RG_WASM_BODY_P1/P2/TRAFFIC0`,
  `RG_WASM_TRAFFIC_COUNT 15`.
- `/* contact body id encoding */` `RG_WASM_ID_WALL_L/R`, `RG_WASM_ID_CONE0`,
  `RG_WASM_ID_BAR0` — autopeli entity ranges presented as the standard.
- `RG_WASM_SOUND_WALL/BOUNCE/WIN`, `RG_WASM_OFF_AIR_P1/P2` — autopeli semantics.

The ABI *transport* (header layout, fixed-point, contact/event structs) is fine
and genuinely generic. Only the *meaning* baked into comments/constants leaks.

### 2.3 Game-named modules sitting in the core folder

`scripting/wasm_autopeli_setup.rgr` and `scripting/wasm_autopeli_render.rgr` are
game code living in the engine-core directory. `WasmVisualEntity` (a genuinely
generic type) is also defined inside `wasm_autopeli_render.rgr`.

### 2.4 `scripting/wasm_game_runner.rgr` — same disease, milder (Pong)

The non-physics runner hardcodes Pong: `ball`/`p1`/`p2` sprites, `ball_x`,
`paddle1_y`, net rendering, score layout. Lower priority (Pong is tiny) but the
same fix pattern applies; fold it in once the provider interface exists.

---

## 3. Target architecture

One generic host, one interface, per-game providers. The guest is the source of
truth for the world.

```
┌──────────────────────────────────────────────────────────────┐
│ WasmPhysicsRunner (core, scripting/)                          │
│   - drives ABI I/O, GamePhysics.step, generic render + HUD    │
│   - owns NO game constants; asks the provider for everything  │
│         scene, sprite map, camera policy, HUD, vocab          │
└───────────────┬──────────────────────────────────────────────┘
                │ GameSceneProvider (interface)
   ┌────────────┴───────────────┐
   │ AutopeliSceneProvider      │   games/autopeli_wasm/scene/*.rgr
   │  = Setup + Render + Hud    │   (moved out of scripting/)
   └────────────────────────────┘   + future: PinballProvider, …
```

### 3.1 `GameSceneProvider` interface (core)

A small interface the core depends on instead of concrete autopeli classes:

```
interface GameSceneProvider {
    fn buildScene(phys:GamePhysics bodyIds:[string]) : void   ; bodies + bounds
    fn worldSize() : (int, int)                                ; w, h
    fn initAssets(render:GenericRender pw:int) : void          ; sprite templates
    fn buildStaticBg(render:GenericRender) : void              ; background
    fn spriteFor(id:string) : string                           ; entity → template
    fn bodyCodeToId(code:int) / contactBodyCode(id) : ...      ; ABI id encoding
    fn cameraFor(paneIdx:int, phys) : int                      ; camera policy
    fn playerCount() : int
    fn drawHud(target:SoftCanvas paneIdx:int abi:WasmAbiMem)   ; HUD (or RGU1)
    fn mapEvent(kind:int sub:int) : GameEventNative            ; sound/particle ids
}
```

The autopeli implementation is exactly today's `WasmAutopeliSetup` +
`WasmAutopeliRender` + `drawHudOn` logic, moved verbatim behind this interface.

### 3.2 Guest owns the world (removes the double-hardcode)

Preferred long-term source of truth is the **guest**, via the ABI it already
partly uses:

- The guest already declares resources (`declare_resources()` → `host_sheet`).
  Extend the same pattern so the guest declares **bodies, bounds, world size,
  camera hints, and static-bg spec** into a scene section of the ABI (or via new
  host imports), which the *default* provider reads generically.
- Then `wasm_autopeli_setup.rgr`'s `setupPhysics()` host copy is deleted; the
  road exists only in `rust_autopeli` (and its `.as` twin). One owner.
- Games too simple to describe a full scene can ship a tiny `.rgr` provider in
  their own folder instead — both routes satisfy the same interface.

### 3.3 ABI header stays neutral

Rewrite the autopeli-specific comment blocks in `wasm_game_abi.h` to describe
*conventions the guest defines* (id-code ranges, event sub-ids, body indices),
and move autopeli's specific numbers into a guest-side `autopeli_abi.h` (or just
constants in `rust_autopeli`). `AIR_P1/P2` become generic "guest scalar slots"
or are documented as optional guest-defined fields.

---

## 4. Phased migration (each phase ships green)

Every phase keeps all three autopeli variants (`autopeli_wasm`, `autopeli_as`,
`autopeli_as_src`) plus Pong/Breakout/etc. runnable. Verify with the existing
demos (`scripting/wasm_autopeli_runner_demo.rgr`,
`autopeli_physics_runner_demo.rgr`, `split_screen_runner_demo.rgr`) and the SDL
smoke targets after each phase.

**Phase 0 — Guardrails + freeze (this PR).**
Add [`../AGENTS.md`](../AGENTS.md) and this plan. No behavior change. Optionally
add a CI grep test (§5) that currently *allow-lists* the known leaks so new ones
fail fast.

**Phase 1 — Extract the interface; move types; no logic change.**
- Define `GameSceneProvider` + a generic `WasmVisualEntity`/render container in
  core (move `WasmVisualEntity` out of the autopeli render file into a neutral
  `game_visual_entity.rgr`).
- Create `games/autopeli_wasm/scene/autopeli_setup.rgr` / `autopeli_render.rgr`
  by relocating `scripting/wasm_autopeli_setup.rgr` + `wasm_autopeli_render.rgr`
  (git mv). Rename classes `Autopeli*`.
- `WasmPhysicsRunner` holds `provider:GameSceneProvider` instead of concrete
  `setup`/`render` fields; a small factory picks `AutopeliSceneProvider` for the
  autopeli games. Logic unchanged — just indirected.

**Phase 2 — Push game logic through the interface.**
Move `spriteFor`, `contactBodyCode`/`bodyCodeToId`, `playerOnOil`, HUD drawing,
event vocabulary, camera policy, `worldH`/start-line constants, and
`resolvePlayerCount` from `WasmPhysicsRunner` into `AutopeliSceneProvider`. Core
now contains zero autopeli identifiers. The §5 grep passes on `wasm_physics_runner.rgr`.

**Phase 3 — Single world owner (guest).**
Extend the ABI scene handshake (§3.2); make the default provider build the world
from guest-declared data; delete host-side `setupPhysics()` hardcode. Autopeli's
world now lives only in the guest. Split-screen host reads camera hints from the
provider, not constants.

**Phase 4 — Neutralize the ABI header.**
Rewrite `wasm_game_abi.h` comments/constants per §3.3; move autopeli specifics
guest-side. Bump ABI doc, keep the wire layout/version stable.

**Phase 5 — Prove genericity with a second game (regression guard).**
Add one small non-autopeli host-physics game (e.g. a "bumper" arena or reuse the
`physics_sandbox`) that loads through the *same* `WasmPhysicsRunner` with its own
provider/guest. This is the real test that the abstraction holds, and it becomes
a permanent regression fixture.

---

## 5. Enforcement: a leak test

Add a cheap guard so the boundary can't silently rot (wire into the existing
test runner / CI):

```bash
# Fails if a generic core runtime file names a specific game.
FILES="gallery/game_engine/scripting/wasm_physics_runner.rgr \
       gallery/game_engine/scripting/game_runtime.rgr \
       gallery/game_engine/scripting/wasm_game_runner.rgr"
if grep -rniE 'autopeli|\bpong\b|pacman|invaders|breakout' $FILES; then
  echo 'LEAK: engine core references a specific game (see gallery/game_engine/AGENTS.md)'
  exit 1
fi
```

Start it allow-listing today's known offenders (`wasm_game_runner.rgr` until
Pong is migrated), then tighten as each phase lands.

---

## 6. Per-game work (the "fix the games too" half)

| Game | Change |
|------|--------|
| `games/autopeli_wasm` | Gains `scene/` provider (Phase 1). Guest becomes sole world owner (Phase 3). Assets already local. |
| `games/autopeli_as` / `autopeli_as_src` | Same provider (ABI-identical). Verify `.as` guest declares scene the same way the Rust guest does; keep the two guests in parity (`as_autopeli/tools/parity.cjs`). |
| `games/rust_pong` + `wasm_game_runner.rgr` | Fold into the provider model once it exists (Phase 5 candidate; low urgency). |
| new `games/<physics-demo>` | Phase 5 — the second physics game that proves the host is generic. |

---

## 7. Out of scope / non-goals

- No change to the ABI *wire layout* or version number except the header
  comments (Phase 4) and the additive scene handshake (Phase 3).
- No rewrite of `physics_core.rgr` / `game_physics.rgr` — those are already
  game-neutral and are the model to imitate.
- Rendering-engine (EVG) unification is tracked elsewhere (`RENDERING_EVG.md`);
  this plan only stops game specifics from living in the host.

---

## 8. One-line summary

**Make `WasmPhysicsRunner` ask a `GameSceneProvider` for the world instead of
being the autopeli game; give the world a single owner (the guest); and add a
grep guard + `AGENTS.md` so a game can never leak back into the core.**
