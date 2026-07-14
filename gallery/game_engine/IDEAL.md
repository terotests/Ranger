# IDEAL — what the game-engine interfaces *should* look like

> Status: **target specification** (companion to [`AGENTS.md`](./AGENTS.md),
> [`scripting/PLAN_PROVIDERS.md`](./scripting/PLAN_PROVIDERS.md) and
> [`scripting/PLAN_PHYSICS_RUNNER_GENERIC.md`](./scripting/PLAN_PHYSICS_RUNNER_GENERIC.md)).
>
> This document does **not** describe today's code. It describes the interfaces
> the engine is *aiming* at, derived from the engine's stated goal, so that every
> refactor has a fixed target to move toward. Where the current code violates the
> target, the violation is shown next to the ideal so the gap is concrete.

---

## The ABI today — current state, problems, and what it does not expose

Before the target: a snapshot of what the shared ABI actually *is* right now, why
it leaks, and which capabilities a game needs but the ABI never hands it (or hands
it only through an ad-hoc, path-specific side channel). This grounds every "ideal"
in §2–§6 against the concrete surface as of today.

### The current surface

Three shared headers under [`wasm/`](./wasm/) define the transport, and every guest
(compiled Rust/AssemblyScript via [`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr),
or interpreted `.as` via [`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) mirrors
the same byte offsets:

| Block | Header | Purpose | Size | Direction |
|-------|--------|---------|------|-----------|
| **RGW1** | [`wasm_game_abi.h`](./wasm/wasm_game_abi.h) | world / physics | 2560 B | mostly guest→host |
| **RGSP1** | [`wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h) | ready-character sprites | 2560 B | host writes catalog + input, guest writes slots |
| **RGU1** | [`wasm_ui_abi.h`](./wasm/wasm_ui_abi.h) | retained-mode UI | 8192 B | guest→host (+ optional `rg_ui_event` back) |

Concretely, RGW1 is a fixed 2560-byte block: a 64-byte header, then
`bodies[32]×24`, `controls[32]×16`, `impulses[16]×16`, `contacts[14]×32`,
`events[12]×20` (at 2048), and a capability-query tail (RGCQ, at 2304). World
coordinates are fixed-point (`FP_SCALE 256`). A forward-compat handshake is
*declared* (`rg_abi_version` / `rg_ui_abi` / `rg_required_caps` /
`rg_declare_queries` / `rg_check_env`, plus `RG_WASM_HOST_CAP_*` bits and the typed
RGCQ query).

**The host→guest channel in RGW1 is only four header words:** `dt_ms`, `time_ms`,
`input`, `input_p2`. Everything else — bodies, controls, impulses, contacts,
events, `score`, `hits`, `camera_y`, `air_p1/p2` — flows guest→host.

Beyond those three headers, several blocks exist **only by convention in code, with
no shared `wasm/*.h`**: `RGP1` pose input (a 128-byte host→guest block wired in
[`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr) and `pose/`), the `RGS1` guest
sprite draw list, the host resource manifest (`hostSheet` / `hostRect`), and a guest
sound queue — the last three are **native-array APIs on the interpreted `.as` path
only**. `RGX1` (streaming) and `RGLD` (loader) are named as siblings but likewise
have no canonical header.

### Problems with the ABI as it stands

| # | Problem | Evidence | Fixed by |
|---|---------|----------|----------|
| 1 | **Game taxonomy frozen into the transport header.** | `RG_WASM_GRIP_SCALE`, `RG_WASM_STEER_SCALE`, `RG_WASM_ID_CONE0`, `RG_WASM_ID_BAR0`, `RG_WASM_BODY_TRAFFIC0`, `RG_WASM_TRAFFIC_COUNT 15`, `RG_WASM_SOUND_WALL/BOUNCE/WIN` in `wasm_game_abi.h`; `RG_SPR_CHAR_HERO/KNIGHT/MAGE/ROGUE` in `wasm_sprite_abi.h`. | §2.1 |
| 2 | **The control record is car-shaped.** The 16-byte record is `steer/throttle/brake/grip`, and that vocabulary leaks host-side into `readControlSteer/Throttle/Brake/Grip` ([`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr)) and `writeControl(steer,throttle,brake,grip)` ([`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)). | §2.2 |
| 3 | **Autopeli scalars sit in the shared header.** `RG_WASM_OFF_AIR_P1/P2` are one game's values living in a header every game must include. | §2.1 |
| 4 | **A comment names a game in a shared header.** `/* Standard body indices (autopeli) */`. A game name in a transport header *is* the bug. | §2.1 |
| 5 | **The capability gate is dead.** Guests may export `rg_abi_version` / `rg_required_caps` / `rg_check_env`, but nothing in `scripting/` ever calls them (grep = 0 hits), so a guest that needs a missing cap reads zeroed memory instead of being rejected at load. | §6 |
| 6 | **The world is encoded twice.** The road + traffic live in both `wasm_autopeli_setup.rgr` (host) and `rust_autopeli/src/lib.rs` (guest); they agree only by convention. | §5 |
| 7 | **RGCQ negotiation is inert.** The typed query tail exists, but no host resolves `rg_declare_queries` / `rg_check_env`, so every guest silently falls back to its own defaults. | §6 |

### Interfaces the ABI does not expose, or exposes only partially

These are capabilities a game realistically needs that the shared ABI hands over
incompletely — or not at all — today. Each is a candidate seam the ideal must open
without re-widening the leaks above.

| Capability a game needs | Status today | Limitation | Ideal home |
|-------------------------|--------------|------------|------------|
| Declare its own **world** (bodies, bounds, world size, player count, camera hints, static-bg) | Partial | The guest declares *resources* (sheets/rects) through the manifest, but **not** bodies/bounds/world-size/player-count; those come from the host's own copy. No `worldSize()`/`playerCount()` channel. | §3, §5 |
| Know the **viewport / screen size** in a physics guest | Missing | RGSP1 has `VIEW_W`/`VIEW_H`, but RGW1 has no view fields, so a physics guest cannot size or letterbox itself. | §2.1 (RGCQ `screen.*`) |
| **Richer input** (analog sticks, pointer/touch, text, per-player remap) | Minimal | Only two i32 bitfields (`input`, `input_p2`); no analog axes, no pointer, no text entry. | §2.1 |
| **Pose / body-tracking input** | Ad-hoc | Exists as a 128-byte `RGP1` block in two incompatible layouts across hosts; no shared header, only position + a discrete gesture (no motion/speed). | §2.4, §6 |
| **Game-defined sound palette** | Rigid | A fixed enum (`RG_WASM_SOUND_WALL/BOUNCE/WIN`) in the header; the `.as` path bolts on an integer `playSound` queue instead. No way to register a per-game palette through the ABI. | §4 |
| **Generic guest scalar slots** | Missing | Only `air_p1/air_p2` are hard-coded; there is no documented generic "guest scalar" the host transports opaquely. | §2.1 |
| **Genre-neutral control channels** | Missing | Only the four named car channels; no indexed `readControlChannel(body, ch)`. | §2.2 |
| **Collision shape, filtering, sensors, full contacts** | Minimal | The body record carries pose but no shape; body↔body is circle-only; contacts define only a `BEGIN` phase (no `PERSIST`/`END`, depth, or tangent impulse); no layer/mask filtering, no sensor/trigger bodies. | §2.5 |
| **Selectable physics engine** | Missing | A full Cannon.js rigid-body port exists (`physics/src/cannon_*.rgr`) but no interface lets a game choose it over the arcade core; the ABI is tied to one engine's output. | §2.5 |
| **Body→sprite binding** | Fragmented | Three unrelated models (host `spriteFor` templates, RGSP1 catalog, `.as` RGS1 draw list); no single contract that makes a body's pose drive a sprite/character on every path. | §2.5 |
| **Data-driven sprite roster & animations** | Partial | A catalog-id table (`RG_SPR_OFF_CAT_IDS`) exists, but character ids are still frozen constants, and animations are limited to `WALK/RUN/JUMP` with `RUN`/`JUMP` falling back to `WALK`. | §2.1 |
| **Guest draw list / resource manifest / sound queue as first-class ABI** | Path-specific | `RGS1`, the resource manifest, and the sound queue are native-array APIs on the interpreted `.as` path only — not a shared byte block, so compiled-WASM guests cannot use them uniformly. | §2, §5 |
| **Streaming (`RGX1`) and loader (`RGLD`)** | Unheadered | Referenced as siblings of RGW1 but have no canonical `wasm/*.h`, so their offsets are not a stable contract. | §2 |
| **Save-state / persistence, networking, clock/RNG seed, config negotiation** | Absent | Nothing beyond `dt_ms`/`time_ms`; no deterministic seed, no persistence, no negotiated timestep/config. | §2.1 (RGCQ), §6 |
| **RGU1 interactivity** | Optional | The document is guest→host; `rg_ui_event` (activate/select) is an optional export and selection state lives on the host. | §2.3 |
| **Dynamic UI (allocate/free host EVG objects)** | Missing | RGU1 is full-snapshot rebuild only; the guest cannot allocate a persistent host `EVGElement`, mutate it by handle, or free it — any change re-serializes and rebuilds the whole tree. | §2.6 |
| **Dynamic / streamed resource loading** | Prototype | A declare-once manifest and a synchronous frame-path decoder ship; a WASM streaming vertical (`RGX1` worker + `RGLD` loader) is proven but uses mock handles — the public `rg_res_*` primitives, the `RGO1` observation block, shared headers, and async decode are not landed. | §2.7 |

---

## Affected areas — the work to reach better organisation and interface parity

The state above exposes two kinds of gap, and every affected area below is chosen to
close one or both:

- **Parity across ABI *blocks*.** RGW1 / RGSP1 / RGU1 each earned a header, a
  magic/version/size, and (for RGU1) a validation contract; `RGP1`, `RGS1`, `RGLD`,
  `RGX1` did not. Parity means *every* block shares the same discipline — a
  `wasm/*.h` offset header, a versioned magic, a host validator, and a capability
  bit — so no block is a second-class citizen.
- **Parity across guest *paths*.** The compiled-WASM path
  ([`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr)) and the interpreted `.as` path
  ([`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) must expose the *same*
  capabilities against the *same* offsets. Today pose, the sprite draw list, the
  resource manifest, and the sound queue exist only on the `.as` path — a game
  written once does not behave identically on both backends.

The areas, ordered roughly by how much they unblock the rest:

| # | Affected area | Files | Organisation gain | Parity gain | Target § |
|---|---------------|-------|-------------------|-------------|----------|
| 1 | **Split game taxonomy out of the shared headers** | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h` → guest crates (`wasm/rust_autopeli/`, `wasm/as_autopeli/`) | Header holds only bytes/offsets/handshake; no game name or comment | — | §2.1 |
| 2 | **Generic control channels** | `wasm/wasm_game_abi.h`, `scripting/wasm_abi_io.rgr` (`readControlSteer/…` → `readControlChannel`), `scripting/as_abi_bridge.rgr` (`writeControl`) | One record shape for all genres | Both guest paths read/write the same indexed channels | §2.2 |
| 3 | **Give every informal block a header** (`RGP1` pose, `RGS1` draw list, `RGLD` loader, `RGX1` streaming) | new `wasm/wasm_pose_abi.h`, `wasm/wasm_sprite_list_abi.h`, `wasm/wasm_loader_abi.h`, `wasm/wasm_stream_abi.h` (siblings of the three existing headers) | Every block has one canonical offset table + versioned magic | The compiled-WASM path can implement what only `.as` has today | §2, §2.3 |
| 4 | **Bring `.as`-only APIs to parity on both paths** (pose, draw list, resource manifest, sound queue) | `scripting/wasm_abi_io.rgr` (add readers), `scripting/as_abi_bridge.rgr` (back native-array APIs with the documented byte blocks) | One accessor per block, per path, sharing offsets | A guest runs identically compiled or interpreted | §2 |
| 5 | **Activate the capability handshake + gate** | `scripting/wasm_physics_runner.rgr`, `scripting/wasm_game_runner.rgr`, `scripting/wasm_sprite_runner.rgr`, `scripting/as_source_runner.rgr` (shared gate helper) | One place calls `rg_abi_version`/`rg_required_caps`/`rg_check_env` + resolves RGCQ | Same gate for every guest/block/path; a missing cap rejects instead of reading zeros | §6 |
| 6 | **Uniform block validation** (magic/version/bounds/utf-8), copying RGU1's discipline | `scripting/wasm_abi_io.rgr` (`verifyMagic` generalised), a shared validator for RGW1/RGSP1/RGP1/RGS1 | One validator, not per-block ad-hoc checks | Every block is validated the same before use, on both paths | §2.3 |
| 7 | **Provider registry for host↔guest capabilities** | `scripting/PLAN_PROVIDERS.md`, `scripting/game_pose_provider.rgr`, `scripting/game_image_loader.rgr`, the runners in row 5 | Capabilities wire at fixed seams, not by hand | Adding a block = registering a provider (capBit/direction/cadence); parity is enforced by construction | §6 |
| 8 | **Generic scene seam** (`GameSceneProvider` instead of concrete autopeli types) | `scripting/wasm_physics_runner.rgr`, `scripting/wasm_game_runner.rgr` (drop `Import "./wasm_autopeli_setup.rgr"` / `wasm_autopeli_render.rgr`), logic → `games/autopeli_wasm/scene/` | Core compiles against an interface, not a game | A second physics game reuses the runner unchanged | §3 |
| 9 | **Single world owner** (guest declares bodies/bounds/world-size/camera via the declare-once channel) | `scripting/wasm_autopeli_setup.rgr` (deleted), guest `lib.rs`, the resource-manifest block from row 3 | World lives in exactly one place | Same declaration works on both paths | §5 |
| 10 | **Data-driven sprite roster & animations** | `wasm/wasm_sprite_abi.h` (drop `RG_SPR_CHAR_*`), `lpc/src/lpc_char_catalog.rgr`, `lpc/pack/**/catalog.json` | Roster is data (`RG_SPR_OFF_CAT_IDS`), not frozen constants | Same catalog visible to every guest/path; documented anim fallbacks | §2.1 |
| 11 | **Unified sound palette** (fold RGW1 sound enum + `.as` sound queue into one registered per-game palette) | `scripting/game_audio.rgr`, `scripting/wasm_abi_io.rgr`, `scripting/as_abi_bridge.rgr`, `wasm/wasm_game_abi.h` | Core owns a synth; names are game data | One sound mechanism on both paths, no fixed ids | §4 |
| 12 | **Richer, uniform host→guest input** (analog/pointer/pose beyond two bitfields; add view size to RGW1) | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h`, the runners in row 5 | Input is one typed surface, not scattered header words | RGW1 and RGSP1 carry the same input + viewport fields | §2.1 |
| 13 | **ABI index + CI leak guard** | new `wasm/README.md` (block/version/direction/header index), CI wiring of the §7 grep | One document enumerates every block; drift is caught mechanically | The guard runs against every core file and header equally | §7 |
| 14 | **Cross-path & second-game conformance fixtures** | `games/<second_physics_game>/`, a test that runs one guest on WASM *and* `.as` and diffs the block bytes | Proof the abstraction holds becomes a permanent test | Guarantees the two paths stay byte-identical | §7 |

Rows 1–4 are the ABI-surface cleanup, rows 5–7 the wiring/enforcement layer, rows
8–11 the seam/ownership moves, and rows 12–14 the input, documentation, and proof
that lock parity in. They map onto the concrete changes in §8 (rows 1/2/8/11/9
correspond to summary changes 1–5) plus the parity-specific additions (rows 3–7,
10, 12–14) that this analysis surfaces.

---

## Use cases — what a developer wants, and how the interface answers

The point of the whole design is that each of these is *additive*: something the
game or its own guest supplies, with no edit to `scripting/` core. If a use case
below forces a core edit today, that is the leak the referenced section removes.

| Use case | What the developer does | How the interface answers | § |
|----------|-------------------------|---------------------------|---|
| Add a second physics game (e.g. a bumper arena) beside autopeli | Write a `GameSceneProvider` + a guest under `games/<name>/` | Core (`WasmPhysicsRunner`) is compiled against the interface, so it drives the new game with **zero core edits**; the leak-grep + "second game" fixture prove it. | §3, §7 |
| Port a game from Rust to AssemblyScript (or add a C guest) | Recompile the guest against the same ABI offsets; leave the host untouched | The ABI is a byte transport shared by every guest language; the game's *names* live in its own source, so the host reads identical channels regardless of guest. | §2.1–§2.2 |
| Change the track layout or traffic count | Edit constants in the guest source only | The world has a **single owner** (the guest); the host-side copy is deleted, so nothing can drift out of sync. | §5 |
| Add a host capability (pose input, rumble, particles) | Register a `GameProvider` with its `capBit` / direction / cadence | The registry wires it at the three fixed seams and advertises the cap; a guest that *requires* it is gated at load instead of reading zeroed memory. | §6 |
| A game needs a new on-screen shape (a ghost) or sound | Call `registerShape("ghost", fn)` / `registerSound("brick", spec)` at setup | Core dispatches by table lookup and ships only primitives; no `kind=="ghost"` / `"brick"` branch is added to `game_sprite.rgr` / `game_audio.rgr`. | §4 |
| A game needs a custom HUD (score, gauges, menu) | Build a retained-mode RGU1 document each frame in the guest | The guest owns the UI document and the host renders it; no per-game HUD branch in `game_runtime.rgr`. | §2.3, §4 |
| Ship a new playable character in the sprite game | Add it to the character pack + catalog table; select it by numeric id | The sprite ABI carries a runtime catalog (`RG_SPR_OFF_CAT_IDS`), so the roster is data — not an `RG_SPR_CHAR_*` constant frozen into the header. | §2.1 |
| Run a game on a device missing a feature (no GPU / gamepad / pose camera) | Nothing extra — the guest queries capabilities and adapts or aborts cleanly | The typed capability query (RGCQ) + `rg_check_env` let the guest narrow behaviour or reject with a reason, instead of crashing on absent hardware. | §2.1, §6 |

---

## 0. The one goal every interface must serve

From [`ROADMAP.md`](./ROADMAP.md):

> Write game logic once → iterate on Mac (Node / TSX / WASM) → run the same logic
> as a native binary on a Raspberry Pi.

That promise holds **only if the engine core contains zero knowledge of any single
game.** The core is the reusable half; a game is the disposable half. The moment a
game's name, entity, world constant, sound id, or player count appears in the core,
the "write once, run on many backends" claim quietly becomes "write once *for
autopeli*." So the north star for every interface below is a single invariant:

> **A hypothetical *second* game of the same genre must be able to reuse a core
> file unchanged.** If it can't, the file is a game, not core.

§7 turns this invariant into a grep + a regression fixture.

---

## 1. The three layers (the boundary every file is on exactly one side of)

| Layer | Lives in | Knows about | Must NOT know about |
|-------|----------|-------------|---------------------|
| **Engine core** | `scripting/` runtimes, `framebuffer.rgr`, ABI helpers, generic runners | Framebuffers, the ABI *shape*, physics primitives, sprite/HUD *mechanisms* | Any specific game — its entities, world size, sprites, HUD gauges, sound names, player count |
| **Reusable subsystems** | `physics/`, `lpc/`, `menu/`, `ui/`, `pose/` | Their own domain (bodies, spritesheets, UI trees) | *Which* game is using them |
| **A game** | `games/<name>/`, its WASM/`.as`/TSX guest, its `<Name>Scene`/`Render`/`Hud` modules | Everything about itself | Nothing in core needs to know it exists |

Every leak in this codebase is a violation at a *seam* between two of these layers,
so §2–§6 each specify one seam. §2 is the widest (the ABI, shared by three guest
languages and the host), so it gets the most detail.

---

## 2. The ideal WASM ABI — a *transport*, never a *taxonomy*

The shared ABI is three headers: `wasm/wasm_game_abi.h` (RGW1, world/physics),
`wasm/wasm_sprite_abi.h` (RGSP1, characters), `wasm/wasm_ui_abi.h` (RGU1, UI).

> **"guest" vs "host" — say it once, precisely.** The **guest is the game itself**,
> compiled to a WASM module — normally written in **Rust** (`wasm/rust_*/src/lib.rs`)
> or **AssemblyScript** (`wasm/as_*/assembly/index.ts`), or run through the interpreted
> `.as` path. The **host** is the Ranger engine (`scripting/` `.rgr` files) that loads
> that module and drives it each frame. The only thing crossing between them is the
> shared linear-memory block described by the ABI header — no pointers, no objects.
>
> So "guest-side" below means **inside the game's own Rust crate / AssemblyScript
> module**, next to `lib.rs` / `index.ts`, compiled into the same `.wasm`. It does
> **not** mean a file that sits in `wasm/` next to the shared headers, and it
> **never** means anything in `scripting/` core. The shared `.h` headers exist only
> because C-style `#define`s are the lowest common denominator all three guests can
> mirror; the constants a game owns do not belong in them, they belong in the game's
> source in the game's own language.

### 2.1 Rule: the ABI defines *bytes and structure*, the guest defines *meaning*

**In the ABI (generic, may stay):**
- Header layout, magic, version, sizes.
- Fixed-point scale for world coordinates (`FP_SCALE`).
- The *shape* of the body / control / contact / event / slot records — offsets and
  widths.
- Count caps (`MAX_BODIES`, `MAX_EVENTS`, …) as buffer bounds.
- The forward-compat handshake (`rg_abi_version` / `rg_required_caps` /
  `rg_check_env`) and the typed capability query (RGCQ).

**Out of the ABI (a specific game's meaning — belongs guest-side):**

In the "Ideal home" column, *guest source* means the game's own Rust crate or
AssemblyScript module (`wasm/rust_autopeli/src/`, `wasm/as_autopeli/assembly/`) —
compiled into the game's `.wasm`, never added to the shared `wasm/*.h` and never to
`scripting/` core.

| Currently in the header | Why it's a game, not a transport | Ideal home |
|-------------------------|----------------------------------|------------|
| `RG_WASM_GRIP_SCALE`, `RG_WASM_STEER_SCALE` | grip/steer are a driving game's dynamics | a `const` in the autopeli guest source (Rust `const` / AS `const`) |
| `RG_WASM_ID_CONE0`, `RG_WASM_ID_BAR0` | cones/bars are autopeli entities | autopeli guest source |
| `Standard body indices (autopeli)` — `RG_WASM_BODY_TRAFFIC0`, `RG_WASM_TRAFFIC_COUNT 15` | "traffic" and a 15-count are game design | autopeli guest source |
| `RG_WASM_SOUND_WALL / BOUNCE / WIN` | one game's sound vocabulary | a guest enum; host maps ids opaquely (§4) |
| `RG_WASM_OFF_AIR_P1/P2` | an autopeli scalar | a **generic** "guest scalar slot" the ABI documents as guest-defined |
| `RG_SPR_CHAR_HERO / KNIGHT / MAGE / ROGUE` | a character roster | the character pack + its runtime catalog table (already exists: `RG_SPR_OFF_CAT_IDS`) |

The header's own comments should read *"body-index meaning, id-code ranges, and
event sub-ids are **conventions the guest defines**"* — never *"Standard body
indices (autopeli)."* A comment that names a game in a shared header is the bug.

### 2.2 The per-body control record must be genre-neutral

Today the 16-byte control record is `steer / throttle / brake / grip` — a car. That
vocabulary then leaks all the way up the stack (see §3, §6). The ideal control
record is **four opaque scalar channels** plus a bitfield, with meaning assigned by
the guest:

```c
/* Generic per-body control (16 bytes). Channels are guest-defined; the host only
 * transports them. A racing guest reads ch0 as steer, ch1 as throttle, …; a
 * top-down shooter reads them as aimX/aimY/fire — the ABI does not care. */
#define RG_WASM_CTRL_OFF_CH0    0   /* i32 fixed-point control channel 0 */
#define RG_WASM_CTRL_OFF_CH1    4   /* i32 fixed-point control channel 1 */
#define RG_WASM_CTRL_OFF_CH2    8   /* i32 fixed-point control channel 2 */
#define RG_WASM_CTRL_OFF_CH3    12  /* i32 fixed-point control channel 3 */
```

The generic channel *offsets* above are the only thing the shared ABI defines. The
game names *its* channels **inside its own guest source**, in whatever language the
guest is written in — the naming is compiled into the `.wasm`, so it costs the host
nothing and reaches no core file:

```rust
// wasm/rust_autopeli/src/lib.rs — the game (Rust guest), compiled to .wasm.
// These names live in the game, NOT in wasm/wasm_game_abi.h and NOT in scripting/.
const CTRL_STEER:    usize = RG_WASM_CTRL_OFF_CH0;
const CTRL_THROTTLE: usize = RG_WASM_CTRL_OFF_CH1;
const CTRL_BRAKE:    usize = RG_WASM_CTRL_OFF_CH2;
const CTRL_GRIP:     usize = RG_WASM_CTRL_OFF_CH3;
```

```ts
// wasm/as_autopeli/assembly/abi.ts — the same game as an AssemblyScript guest.
// Same generic offsets, same game-local names; also compiled into the .wasm.
export const CTRL_STEER:    i32 = RG_WASM_CTRL_OFF_CH0;
export const CTRL_THROTTLE: i32 = RG_WASM_CTRL_OFF_CH1;
export const CTRL_BRAKE:    i32 = RG_WASM_CTRL_OFF_CH2;
export const CTRL_GRIP:     i32 = RG_WASM_CTRL_OFF_CH3;
```

(A C or C++ guest, if one is ever added, would use a `.h`; the common guests are
Rust and AssemblyScript.)

Consequently the host side stays genre-neutral too: `wasm_abi_io.rgr` exposes
`readControlChannel(bodyIdx, ch)` — **not** `readControlSteer/Throttle/Brake/Grip` —
and `as_abi_bridge.rgr`'s `writeControl` takes indexed channels.

### 2.3 The UI ABI (RGU1) is the model to imitate

`wasm/wasm_ui_abi.h` is already correct and should be cited as the reference: a flat
retained-mode document the guest owns, the host renders; *"No host pointers or EVG
objects ever cross into the guest,"* the host treats the block as untrusted and
validates it. Every future block (RGP1 pose, a scene block, …) should copy this
discipline: **fixed typed layout, no pointers cross, snapshot-first, host validates.**

### 2.4 The pose block (RGP1) — motion and speed are first-class channels

Pose detection is the engine's first host→guest **streaming input** block: a camera
+ AI model (MediaPipe on the web, TFLite natively) produces a skeleton each frame,
and the game reacts to where the body is and *how it is moving*. It is exactly the
"future block" §2.3 anticipates, and it is also the sharpest illustration of the
parity gaps above — so it gets a full treatment, with a concrete answer to the one
question the transport must settle: **how are motion and speed defined?**

**Current state (the drift is live).** RGP1 has no shared header, and the hosts
already disagree on its bytes:

| Producer | Layout it writes | Header |
|----------|------------------|--------|
| Native SDL host — [`pose/native_provider/rg_pose.h`](./pose/native_provider/rg_pose.h) | `present@0, gesture@4, count@8, revision@12, landmarks@16` | none |
| Browser / MediaPipe — [`pose/mediapipe_poc/rgp1.mjs`](./pose/mediapipe_poc/rgp1.mjs) | `present@0, gesture@4, count@8, seq@12, landmarks@16` | none |
| Interpreted `.as` bridge — [`scripting/as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr) | `magic@0, version@4, revision@8, present@12, gesture@16, count@20, landmarks@32` | magic/version |

A guest carried between the native host and the `.as` host therefore reads pose from
the *wrong offsets* — the "no shared header → drift" failure from the parity
analysis, happening in real code today. On top of that, every producer ships only
**position** (landmark `x/y` in fixed-point) plus a discrete `gesture`, so a game
that reacts to *how fast* a hand moves has to difference positions itself — duplicating
the smoothing the host already runs ([`PoseSmoother` / One-Euro in
`rg_pose.h`](./pose/native_provider/rg_pose.h)) and inventing its own clock. And
`rgp1.mjs` stores `nose.x * VIEW_W * FP` (a nominal 480×270), baking a view size into
the coordinate — the pose analog of the world-encoded-twice leak (§5).

**Ideal — the principles.**

1. **One shared header, RGU1-discipline.** Define `wasm/wasm_pose_abi.h` with
   `magic` / `version` / `size`, host validation, and a **seqlock `revision`** (odd =
   mid-write, even = stable) so a reader never tears. One layout for every host and
   both guest paths (§ parity).
2. **Coordinates are normalized and view-independent.** Positions are stored as
   normalized `[0,1] × FP_SCALE`, **not** multiplied by any view size; the guest
   scales into its own world (`x_world = xFp/FP_SCALE × worldW`). Pose stops
   depending on a screen constant.
3. **Motion is host-provided, computed once.** The host already smooths landmarks
   and owns the true capture `dt`; it is the only place that can produce a clean
   velocity. So per-landmark **velocity** `(vx, vy)` ships in the block — the guest
   never re-differentiates.
4. **Speed is a first-class scalar.** Alongside velocity the host ships
   `speed = |velocity|`, so a guest keys off "how fast" without a square root, and an
   aggregate **body speed** gives "overall player motion" without the guest having to
   pick a joint.
5. **Timing travels with the sample.** The header carries `time_ms` (capture
   timestamp) and `dt_ms` (since the previous published sample) so a guest can derive
   its own motion when the host cannot, and so a `present` 0→1 transition can zero
   velocity instead of spiking.
6. **Fixed-point sized to the quantity.** Positions keep `FP_SCALE` (256). Per-frame
   normalized velocities are small fractions, so velocity/speed use a **finer** scale
   `FP_VEL` (Q16.16, ×65536) documented in the header — a resolution choice, not a
   taxonomy.
7. **Gesture is a convention, not a taxonomy.** `arms_up` / `lean_*` are one style of
   game's vocabulary; per §2.1/§4 the block carries an *opaque* `gesture` id (0 =
   none) that the guest defines from the continuous channels — it is not frozen into
   the transport as "the standard gesture set."
8. **Capability-gated like any provider.** RGP1 plugs in as a `GameProvider`
   (direction host→guest, cadence per-frame, `capBit = RG_WASM_HOST_CAP_POSE_INPUT`,
   already `0x0010` in [`game_pose_provider.rgr`](./scripting/game_pose_provider.rgr)).
   A host without a camera advertises the bit off; a guest that *requires* pose is
   rejected at load (§6), not fed zeros.

**Ideal — the layout.** Motion and speed become explicit typed channels:

```c
/* wasm/wasm_pose_abi.h — RGP1: host->guest streaming pose input. */
#define RG_POSE_ABI_MAGIC   0x31504752u /* 'RGP1' little-endian */
#define RG_POSE_ABI_VERSION 2u
#define RG_POSE_MAX_LM      33u          /* BlazePose skeleton              */
#define RG_POSE_FP_SCALE    256          /* positions: normalized[0,1]*256  */
#define RG_POSE_FP_VEL      65536        /* velocity/speed: Q16.16 per sec  */

/* Header (64 bytes) */
#define RG_POSE_OFF_MAGIC      0   /* u32 'RGP1'                                  */
#define RG_POSE_OFF_VERSION    4   /* u32 ABI version the host wrote              */
#define RG_POSE_OFF_SIZE       8   /* u32 total block bytes                       */
#define RG_POSE_OFF_REVISION   12  /* u32 seqlock: odd=writing, even=stable       */
#define RG_POSE_OFF_PRESENT    16  /* u32 1 if a pose was detected this sample    */
#define RG_POSE_OFF_GESTURE    20  /* i32 guest-defined gesture id (0 = none)     */
#define RG_POSE_OFF_LM_COUNT   24  /* u32 landmarks written this sample           */
#define RG_POSE_OFF_TIME_MS    28  /* i32 capture timestamp, monotonic ms         */
#define RG_POSE_OFF_DT_MS      32  /* i32 ms since the previous published sample   */
#define RG_POSE_OFF_FLAGS      36  /* u32 RG_POSE_FLAG_*                           */
#define RG_POSE_OFF_BODY_VX    40  /* i32 aggregate body velocity x (FP_VEL)      */
#define RG_POSE_OFF_BODY_VY    44  /* i32 aggregate body velocity y (FP_VEL)      */
#define RG_POSE_OFF_BODY_SPEED 48  /* i32 aggregate body speed |v| (FP_VEL)       */
#define RG_POSE_HEADER_SIZE    64

/* landmark[i] at RG_POSE_OFF_LM0 + i*RG_POSE_LM_SIZE */
#define RG_POSE_OFF_LM0        64
#define RG_POSE_LM_SIZE        24
#define RG_POSE_LM_OFF_X       0   /* i32 normalized x * FP_SCALE  (+x = right)    */
#define RG_POSE_LM_OFF_Y       4   /* i32 normalized y * FP_SCALE  (+y = down)     */
#define RG_POSE_LM_OFF_VX      8   /* i32 velocity x, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_VY      12  /* i32 velocity y, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_SPEED   16  /* i32 |velocity|, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_CONF    20  /* i32 visibility/confidence, 0..FP_SCALE      */
/* total size = 64 + RG_POSE_MAX_LM*24 = 856 bytes; read it from OFF_SIZE, never
 * assume it — the block grew past today's 128 B precisely to carry motion.       */

/* flags (RG_POSE_OFF_FLAGS) */
#define RG_POSE_FLAG_VALID         1u /* host finished a full frame               */
#define RG_POSE_FLAG_HAS_VEL       2u /* velocity/speed are host-provided         */
#define RG_POSE_FLAG_SMOOTHED      4u /* landmarks passed the host filter         */
#define RG_POSE_FLAG_JUST_APPEARED 8u /* present flipped 0->1; velocity zeroed     */

/* host capability bit (mirrors game_pose_provider.rgr) */
#define RG_WASM_HOST_CAP_POSE_INPUT 0x0010u
```

**Ideal — motion and speed, defined precisely.** These are the definitions the
transport fixes so every host computes and every guest reads the same thing:

- **Velocity** of landmark *i* is `v = (Δx/Δt, Δy/Δt)` in **normalized units per
  second**, where `Δx, Δy` are the change in *smoothed* normalized position between
  this published sample and the previous one, and `Δt = dt_ms / 1000`. The host
  computes it from the filtered signal (never the raw detector output), so jitter is
  already removed. Axis sign matches the coordinates: `+x` right, `+y` down.
- **Speed** of landmark *i* is the scalar `|v| = sqrt(vx² + vy²)`, same units,
  precomputed so a guest never needs a square root on the hot path.
- **Body velocity / body speed** are the aggregate of a stable central set (hip
  midpoint, falling back to the mean of visible landmarks) — the device-independent
  "how much is the player moving overall" signal, independent of which joint a game
  cares about.
- **Guest scaling.** To act in world units the guest multiplies by its own span:
  `vx_world = vxFp/FP_VEL × worldW`, `vy_world = vyFp/FP_VEL × worldH`. Because the
  ABI's speed is in normalized units it doubles as a resolution-independent "effort"
  measure that behaves the same on a 480×270 PoC and a 1080p camera.
- **Fallback when `HAS_VEL` is 0.** A host whose source only yields positions leaves
  the velocity/speed channels zero and clears `RG_POSE_FLAG_HAS_VEL`; the guest then
  differences positions itself across `REVISION` using `DT_MS`, and honours
  `RG_POSE_FLAG_JUST_APPEARED` to reset instead of registering a huge spurious jump
  when a body (re)enters frame.

This keeps pose a *transport*: the ABI defines position, velocity, speed, timing and
confidence as bytes; what a *gesture* means, and which landmark drives the game, stay
the guest's decision.

### 2.5 Physics, collision detection, and binding bodies to sprites

RGW1 is the "world/physics" block, so how the ABI carries **bodies, collisions, and
the link from a body to the sprite that draws it** is the core of the whole engine.
Three things have to be genre-neutral here — the simulation, the contact model, and
the body→visual binding — and today each leaks or is missing.

**Current state.**

- **The core is good; there are two of them.** [`physics_core.rgr`](./scripting/physics_core.rgr)
  is a genuinely neutral 2D top-down core (`PhysBody` / `PhysBoundary` /
  `PhysCommand` / `PhysContact`), wrapped by the [`GamePhysics`](./scripting/game_physics.rgr)
  facade and a game-free EvalValue adapter
  ([`game_physics_bridge.rgr`](./scripting/game_physics_bridge.rgr)). But a *second*,
  much richer engine — a Cannon.js-style 3D rigid-body port — sits fully implemented
  and unit-tested under [`physics/src/cannon_*.rgr`](./physics/src/) (Vec3, Quaternion,
  Box/Sphere/Plane, AABB, broad/narrow phase, contact equations, `World`) and is
  wired to **nothing**: no ABI, no game. There is no interface that lets a game pick
  an engine, so the arcade core is the only one anything can reach.
- **Collision is circle-approximate and boundary-typed.** `PhysicsCore` runs a cheap
  broad phase (`segmentNearBody` AABB reach) and a narrow phase that is
  point-to-segment for `segment` bounds, wall clamps for `rect` bounds, and a
  **circle** overlap for body↔body (`bodyRadius` = diagonal × 0.72) — even though a
  body owns box half-extents `hw/hh`. Shapes are limited to segment / rect / implicit
  circle; there is no box-box (OBB), no polygon, no per-body shape *type*.
- **The body record carries pose, not shape.** The RGW1 body record (24 B) is
  `x, y, angle, speed, angVel, flags` — pose only. Collision geometry (`hw/hh`,
  vehicle wheels, restitution) lives host-side in `PhysBody` and/or in the guest's
  own source, so the two must agree **by convention** — the world-encoded-twice leak
  (§5) applied to shape.
- **The contact model is half-defined.** `PhysContact` has `begin`/`persist` phases
  (tracked via `prevContactKeys`) and a manifold (`bodyA/B`, `normalImpulse`, point,
  normal), but the shared header only defines `RG_WASM_CONTACT_PHASE_BEGIN` — there
  is **no `PERSIST`, no `END`**, no penetration depth, no tangent impulse, and body
  ids are the autopeli `L`/`R`/`c`/`b`/`p1`/`p2` encoding (§2.1). `RG_WASM_MAX_CONTACTS`
  is a hard 14 with no documented truncation policy. There are **no collision layers/
  masks** and **no sensor/trigger** bodies — every body is solid and collides with
  every other.
- **Three unrelated ways to bind a body to a sprite.** (1) The WASM physics render
  reads a body's pose from RGW1 and drives a `WasmVisualEntity` template chosen by
  `spriteFor(id)` ([`wasm_autopeli_render.rgr`](./scripting/wasm_autopeli_render.rgr),
  host-driven). (2) The RGSP1 character ABI is a **separate** catalog+slots path
  ([`wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h)) with no link to any physics body.
  (3) The interpreted `.as` path exposes an RGS1 guest draw list
  (`drawSprite(tpl, x, y, angleDeg, frame)` in
  [`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) where the guest authors the
  transform directly, with no physics in between. A game written once does not bind
  the same way across backends.

**Ideal.**

1. **One neutral core, the engine behind an interface.** `physics_core` stays the
   arcade default, but simulation sits behind a `PhysicsWorld` interface (`addBody` /
   `setBounds` / `step(dt)` / `contacts()`) so a game can select the arcade core *or*
   the `cannon` rigid-body port *or* the host-native engine with **no ABI change** —
   the ABI transports *results* (poses + contacts), never an engine's internals. This
   also gives the tested `cannon` port a way to actually be used.
2. **Shape is declared once, pose streams per frame.** The guest owns collision
   geometry and declares it through the same declare-once channel it uses for
   resources (§5): a typed **shape descriptor** per body (circle / box / segment /
   polygon). The 24-byte RGW1 body record then keeps streaming *only* pose, and host
   and guest can never disagree on geometry because there is exactly one copy.
3. **A complete, genre-neutral contact model.** The header defines all three phases
   and a full manifold, and body ids are guest conventions (§2.1):

```c
/* Contact phases (RGW1) — today only BEGIN exists. */
#define RG_WASM_CONTACT_PHASE_BEGIN   1   /* pair started touching this step   */
#define RG_WASM_CONTACT_PHASE_PERSIST 2   /* still touching                    */
#define RG_WASM_CONTACT_PHASE_END     3   /* separated this step               */

/* Per-body collision descriptor (declared once, guest-owned). */
#define RG_WASM_SHAPE_CIRCLE   1   /* a = radius (fp)                          */
#define RG_WASM_SHAPE_BOX      2   /* a = halfW, b = halfH (fp)                */
#define RG_WASM_SHAPE_SEGMENT  3   /* a..d = x1,y1,x2,y2 (fp)                  */
#define RG_WASM_SHAPE_POLYGON  4   /* a = vertex count -> a side vertex table  */

/* body.flags — additive, genre-neutral. */
#define RG_WASM_BODY_ACTIVE    1u
#define RG_WASM_BODY_STATIC    2u  /* infinite mass                            */
#define RG_WASM_BODY_SENSOR    4u  /* report overlaps but apply NO response     */
/* plus a u16 layer + u16 mask per body: "which layers am I, which do I hit".  */
```

   The contact record gains penetration depth and a tangent (friction) impulse
   alongside the existing normal impulse, and `MAX_CONTACTS` is either raised or its
   overflow policy (drop-lowest-impulse) is documented — not a silent clamp.
4. **Filtering and sensors are first-class.** Layer/mask bits let a body choose what
   it collides with, and a `SENSOR` flag turns a body into a trigger that emits
   begin/end overlap contacts with no physical response — pickups, finish lines, and
   damage zones stop needing bespoke host code.
5. **World config is negotiated, not hard-coded.** Gravity, the fixed timestep,
   solver iterations, and world bounds come through the declare-once channel / RGCQ
   (§2.1, §6), replacing the hard-coded `worldW/worldH` default (480×270) and the
   `6000`-tall autopeli track baked into the runner (§5). A generic runner steps the
   world at the negotiated timestep with an accumulator, so simulation is
   deterministic regardless of frame rate.
6. **One body→visual binding, identical on every path.** Binding is a single declared
   map the provider owns, not three code paths. A physics body names a **visual** —
   either a sprite template *or* an RGSP1 catalog character — and the host applies the
   body's pose to that visual's transform every frame:

```
interface BodyVisual {                 ; provided by the game (§3), not core
    fn visualFor(bodyId:string) : VisualRef        ; template id | RGSP1 charId
    fn animFor(bodyId:string st:BodyState) : (anim dir flip)  ; guest rule, §4
}
; Host loop, backend-agnostic:
;   for each active body: read (x,y,angle) from RGW1,
;     resolve BodyVisual.visualFor(id),
;     write that transform into the sprite template  OR  the RGSP1 slot xFp/yFp,
;     pick anim/dir from BodyVisual.animFor(id, {speed, vx, vy, lastContact}).
```

   This folds the three current models into one contract: the host-driven
   `spriteFor` mapping, the RGS1 guest draw list, and the RGSP1 character path all
   become *"a drawable has a transform; a physics body may drive that transform."*
   Animation choice (walk vs run by speed, a hit-flash on a `BEGIN` contact) is a
   guest rule over body state — never a `kind == "car"` branch in core (§4).
7. **RGW1 and RGSP1 stop being strangers.** Because a body can bind to a catalog
   character, physics and character animation share one entity: the runner writes the
   body's pose into the character slot and selects the animation/direction from the
   body's velocity and contacts. A walking hero, a rolling boulder, and a racing car
   are then the *same* mechanism with different guest-declared visuals.

The result keeps RGW1 a transport: it carries body pose and a complete, typed contact
stream; *what* a body is shaped like, *which* engine simulates it, and *how* it is
drawn are all data the guest declares — so a second physics game, with different
shapes, filters, and sprites, reuses the runner unchanged (§3, §7).

### 2.6 Dynamic UI — allocating and freeing host EVG objects from the guest

§2.3 praised RGU1 as the block to imitate, and for a *snapshot* UI it is. But it has
exactly one delivery mode, and that mode is the ceiling on what a guest UI can be.
This section adds the complementary mode the engine still lacks: letting a guest
**allocate host objects (EVG elements) dynamically, mutate them, and free them** —
retained, incremental, "dynamic UI" — without ever handing the guest a host pointer.

**Current state.** RGU1 is **full-snapshot retained mode**. The guest rewrites the
*entire* document — nodes, properties, strings — into a fixed-capacity block whenever
anything changes, bumps `revision`, and the host
([`wasm_ui_io.rgr`](./scripting/wasm_ui_io.rgr)) bulk-copies the block, validates it
as untrusted data, and **rebuilds the whole `EVGElement` tree from scratch**
(`WasmUiEvgBuilder.build` → `EVGElement.createDiv()` per node). Consequences:

- **No host object the guest can address.** The host's `EVGElement`s are created and
  thrown away each rebuild; the guest holds no handle to any of them. Node ids exist
  only so the host can map a *selection cursor* back after layout — the guest cannot
  say "mutate element 7's colour" or "keep this panel, drop that row."
- **Every change costs the whole document.** Animating one label's text re-serializes
  all nodes/props/strings and re-parses + re-lays-out the entire tree. Fixed guest
  caps (`RG_UI_MAX_NODES 64`, `RG_UI_MAX_PROPS 128`, `RG_UI_STRING_CAP 1024`) then
  cap how large a UI can be at all.
- **No allocation or free primitive exists.** There is deliberately (§2.3) *no* way
  for the guest to create a persistent host object or release one — which is correct
  for snapshots but blocks large, animated, or editor-style UIs.

**Ideal.** Add a second, capability-gated mode where the guest **allocates host EVG
objects and owns their lifetime through opaque handles** — keeping every RGU1
safety rule (no pointers cross, host validates, host owns memory):

1. **Handles, never pointers.** Allocation returns an opaque `u32` handle, not an
   address — the same discipline RGU1 already states (*"No host pointers or EVG
   objects ever cross into the guest"*). A handle encodes a slot index **and a
   generation**, so a handle used after free fails a generation check and becomes a
   safe no-op instead of a dangling pointer. Handle `0` is null / allocation failure.
2. **The host owns memory; the guest owns lifetime intent.** The host holds the
   `EVGElement`s in a slot table with a free list and maps `handle → EVGElement`. The
   guest never computes an address and cannot free host memory directly; it only
   *requests* creation and destruction of handles in its own arena.
3. **Explicit create / mutate / free**, reusing the RGU1 vocabulary (same kinds and
   property keys/types as §2.3 — only the *delivery* differs):

```c
/* Guest -> host imports (dynamic UI). All ids are opaque handles, never pointers. */
uint32_t rg_evg_create(uint32_t kind);                 /* RG_UI_* kind -> handle (0=OOM) */
void     rg_evg_set_i32  (uint32_t h, uint32_t key, int32_t  v);
void     rg_evg_set_color(uint32_t h, uint32_t key, uint32_t rgba);
void     rg_evg_set_str  (uint32_t h, uint32_t key, uint32_t str_off, uint32_t len);
void     rg_evg_append   (uint32_t parent, uint32_t child);  /* build the tree      */
void     rg_evg_remove   (uint32_t h);                 /* detach, keep the object     */
void     rg_evg_destroy  (uint32_t h);                 /* free h and its subtree      */
void     rg_evg_set_root (uint32_t h);                 /* which handle is the root     */
```

   `rg_evg_set_str` copies bytes *out of* guest memory (host never keeps a guest
   pointer). Every call validates the handle (index in range, generation current,
   arena owned by this guest); an invalid handle is a no-op, not a crash.
4. **Freeing is safe by construction.** `destroy(h)` releases the element and, by the
   ownership tree, its descendants; each freed slot bumps its generation so *every*
   outstanding handle to it (including child handles) goes stale and is ignored.
   `remove` detaches without freeing. Double-free and use-after-free are therefore
   defined no-ops.
5. **A per-guest arena the host can bulk-free.** Every handle a guest allocates
   belongs to that guest's arena. On module unload, teardown, or a guest fault the
   host frees the whole arena in one pass — a sandboxed WASM guest **cannot leak host
   objects**, even if it never calls `destroy`. The pool is bounded; allocation past
   capacity returns `0` so the guest degrades instead of exhausting host memory.
6. **Batched as a command buffer (the delta counterpart to the snapshot).** Because
   one host import per mutation is chatty across the WASM boundary, the same eight
   operations may instead be written by the guest into a shared **command block** and
   applied by the host once per frame — create / set / append / remove / destroy /
   set-root ops with handle and value fields, validated op-by-op. RGU1's *snapshot*
   ("here is the whole document") gains a sibling *delta* ("here are the changes to
   the objects you already hold"), and neither ever passes a pointer.
7. **Same EVG pipeline underneath.** A handle maps 1:1 to a host `EVGElement`;
   `set_*` maps keys onto element fields exactly as `applyProps` does today; `append`
   builds the tree; **EVGLayout** resolves position/size; the existing renderer
   (`GameHudBlitter` / `WasmUiRenderer`) draws it. `destroy` releases the element. The
   dynamic mode is new *plumbing*, not a new renderer.
8. **Capability-gated and additive (§6).** A host advertises a
   `RG_WASM_HOST_CAP_UI_DYNAMIC` bit; a guest that needs handle-based UI is gated at
   load, while snapshot RGU1 (§2.3) stays the zero-dependency default. A game picks
   snapshot for small/simple screens and dynamic allocation for large, animated, or
   editor-style UIs.

**This is a general capability, first used by UI.** "Allocate a host object from the
guest, hold it by handle, and free it" is not UI-specific: the same slot-table +
generation + per-guest-arena discipline should back **any** host resource a guest
creates and releases — fonts, images/textures, sprite templates, sounds, and physics
bodies (§2.5) — turning today's fixed manifests and fixed-capacity blocks into
dynamic, guest-owned, leak-safe lifetimes. Dynamic EVG UI is simply the most
demanding first client, and the place to prove the handle discipline. §2.7 is that
same discipline applied to the heaviest objects of all: streamed game assets.

### 2.7 Dynamic resource loaders — the `streaming_world` example

§2.6 lets a guest allocate and free small host objects (UI elements). Game *assets*
— textures, meshes, audio banks, tilemaps — are the same idea at a much larger scale
and with I/O attached: a big world cannot hold every asset at once, so it must
**load or generate resources as the camera approaches and free them as it leaves**,
keeping live memory bounded no matter how far the player travels. This is the
`streaming_world` stress test, and it is where the resource ABI has to become a real,
uniform interface.

**Current state — two shipped models, plus a proven-but-private streaming vertical.**

- **Declare-once manifest (static).** A guest declares its sheets/rects *once* at
  setup (`rg_host_register_sheet/rect`; mirrored `hostSheet`/`hostRect` in
  [`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) and the host returns a handle.
  This is exactly §5's declare-once channel — correct, but **not runtime-streamable**:
  you cannot add or drop a resource as the world scrolls.
- **Synchronous frame-path decode.** [`game_image_loader.rgr`](./scripting/game_image_loader.rgr)
  (`GameImageLoader`) decodes PNG/JPEG **synchronously on the frame path**, so a large
  cell change stalls the frame. There are **zero threads** in the codebase.
- **A real streaming vertical exists in WASM — but as private blocks with mock
  handles.** The proof-of-architecture from
  [`PLAN_RANGER2D_STREAMING.md`](./PLAN_RANGER2D_STREAMING.md) already runs end to end
  on the wasm3 bridge:
  - an **`RGX1` worker** ([`wasm/rust_worker/`](./wasm/rust_worker/)) — a 2560-byte
    block where the host writes an *observation* (camera transform, view size, world
    grid, entity list) and the guest writes back visibility flags + cell **load/free**
    requests, driven by a camera residency ring with hysteresis (`preload` <
    `retire`);
  - an **`RGLD` loader** ([`wasm/as_resource_loader/`](./wasm/as_resource_loader/), in
    AssemblyScript to prove language-neutrality) — given a request (cell + kind =
    load/generate) it **produces** a resource and, on a free request, **releases** it,
    reporting `live/peak/gen/freed`;
  - `rg_spawn_worker(ptr, len)` lets a game guest spawn one loader from its own WASM;
  - [`StreamingWorldRunner`](./scripting/streaming_world_runner.rgr) drives both,
    blits each live cell's tile, and follows the camera. The stress test roams a
    1000×1000 world and holds **13 live from 1143 generated / 1130 freed** — bounded
    memory under unbounded travel (`gen − freed = live`).
- **What is still missing/mock.** The public host primitives `rg_res_begin/commit/
  free/lookup` do **not** exist yet — the demo materialises requests into *mock*
  handles; the `RGO1` observation is folded into `RGX1` rather than its own block;
  `RGX1`/`RGLD` have **no shared `wasm/*.h`** (the unheadered-block gap from the parity
  analysis); and decode is **synchronous** (async threading is planned S3, unbuilt).

**Ideal.** Turn that proven vertical into one public, dimension-agnostic resource
interface, on the same handle discipline as §2.6. The plan already states the north
star — *"the ABI is the product; the cell-streamer is a sample"* — and the ideal
makes it concrete:

1. **Three ABI surfaces, all dimension- and domain-agnostic.**
   - *Host resource primitives* (host exports, resources as handles):

```c
uint32_t rg_res_begin (uint32_t kind, uint32_t w, uint32_t h, uint32_t fmt); /* -> staging buffer */
uint64_t rg_res_commit(uint32_t staging_id, uint32_t key);  /* hand back filled buffer -> u64 handle */
void     rg_res_free  (uint64_t handle);                    /* refcounted release                     */
uint64_t rg_res_lookup(uint32_t key);                       /* dedup / cache by key                   */
/* kind in { texture2D, mesh, audioClip, tilemap, ... } — nothing says "2D". */
```

   - *Game observation* (`RGO1`, host→worker, revision-gated snapshot): camera
     transform + view volume, world bounds/grid, time, and an optional `wishlist[]`
     of `(resourceKey, priority)` the game emits. A worker may **derive** its needs
     from the camera *or* consume the wishlist — the game chooses.
   - *Worker plugin contract* (`rg_worker_init/tick/shutdown`): a worker is *"just
     another guest,"* on the same bridge as the RGW1 game guest, in any language.
2. **Resources are handle-owned host objects (the §2.6 discipline at asset scale).**
   `rg_res_commit` returns an opaque, **refcounted** handle — never a pointer; the
   host owns the memory (and the GPU upload). Every handle belongs to the spawning
   guest's arena, so on worker shutdown or fault the host bulk-frees the arena — a
   streaming guest **cannot leak textures**. The pool is bounded; `rg_res_begin`
   past capacity returns null so the worker back-pressures instead of exhausting VRAM.
3. **Freeing is the whole point, not an afterthought.** Bounded live memory comes
   from the loader **releasing** resources as cells retire, with hysteresis so a
   camera jittering on a cell edge does not thrash load/free. `streaming_world`'s
   `gen − freed = live` conservation is the invariant the ABI must preserve and the
   permanent regression fixture (§7) that proves it.
4. **"Load" and "generate" are one path.** A file loader and a procedural generator
   both fill a staging buffer and call `rg_res_commit`; the block shape is identical,
   so swapping "decode a PNG" for "synthesize a tile" needs no ABI change (the PoC
   loader *generates* a 16×16 tile through the exact same contract a disk loader uses).
5. **Policy is userland; the engine ships a reference worker.** The cell-streamer is a
   replaceable **reference worker** written against the public ABI — not a privileged
   engine path. A game swaps it for procedural generation, network streaming, or LOD
   selection **without touching the engine**. Streaming is a *resource-producer*
   concern, so the same ABI serves 2D atlases, 3D mesh LODs, and audio banks.
6. **Threading behind a backend, determinism intact.** Decode/generate runs off the
   frame (native `std::thread`/`SDL_Thread`, web Web Worker, or a synchronous
   fallback), while the cheap GL upload stays on the render thread (GL is
   thread-bound). A done-queue is revision-gated and validated as untrusted data
   (RGW1/RGU1 discipline). Streaming may affect **only** rendering and resource
   lifetime — never the RNG, step order, or logic result — so a cell being resident or
   not never changes the game outcome (cross-target determinism holds).
7. **Parity: give the blocks headers and both paths the primitives.** `RGX1`, `RGLD`,
   and `RGO1` gain shared `wasm/*.h` headers like RGW1/RGU1, and `rg_res_*` become
   real host imports on every path (today they are mock on the wasm3 path only) — so a
   streaming game behaves identically compiled or interpreted. Capability-gated via a
   `RG_WASM_HOST_CAP_RES_STREAM` bit (§6); a world that needs streaming is rejected on
   a host that cannot provide it, and the declare-once manifest (§5) remains the
   zero-dependency default for small games.

The result is that a dynamic resource loader is *"just another guest"* holding
handles it allocates and frees — §2.6's rule applied to the largest, most I/O-heavy
objects — and a new streaming strategy (procedural, networked, LOD) is purely
additive: a replacement worker on the same ABI, with not one engine-core edit.

---

## 3. The ideal engine-core ↔ game seam: `GameSceneProvider`

A generic runner must obtain *everything game-specific from an interface it is
compiled against* — never from concrete game types, imports, or constants. This is
the seam that turns `wasm_physics_runner.rgr` from "the autopeli game wearing a
generic name" into a real host.

```
interface GameSceneProvider {
    ; --- world (the guest is the preferred source; a provider is the fallback) ---
    fn buildScene(phys:GamePhysics bodyIds:[string]) : void   ; bodies + bounds
    fn worldSize() : (int, int)                                ; w, h  (no 6000 in core)
    fn playerCount() : int                                     ; no fixed "2" in core

    ; --- presentation ---
    fn initAssets(render:GenericRender pw:int) : void          ; sprite templates
    fn buildStaticBg(render:GenericRender) : void              ; background
    fn spriteFor(id:string) : string                           ; entity id -> template
    fn drawHud(target:SoftCanvas paneIdx:int abi:WasmAbiMem) : void  ; HUD, or emit RGU1

    ; --- ABI conventions THIS guest chose (§2.1) ---
    fn contactBodyCode(id:string) : int
    fn bodyCodeToId(code:int) : string
    fn mapEvent(kind:int sub:int) : GameEventNative            ; sound/particle ids

    ; --- camera policy ---
    fn cameraFor(paneIdx:int phys:GamePhysics) : int
}
```

Rules the interface encodes:

- The core holds `provider:GameSceneProvider`, **never** `setup:WasmAutopeliSetup`.
- The core imports the interface, **never** `wasm_autopeli_setup.rgr`.
- Adding a second physics game = writing a second provider. Zero core edits.

The autopeli implementation is exactly today's setup/render/HUD logic *moved
verbatim behind this interface*, relocated to `games/autopeli_wasm/scene/`.

---

## 4. Game vocabulary is *data the guest declares*, not branches in core

The core runtime, sprite renderer, and audio engine must be **data-driven**. Every
`if (game == "…")` / `if (kind == "<game-shape>")` / hard-coded sound-id in core is
a leak; the ideal replaces each with a registration the game supplies.

| Current leak (core file) | Ideal |
|--------------------------|-------|
| `game_runtime.rgr`: `if (layout == "pong") showNet` / `if (layout == "invaders")` HUD branch | a generic `hud()`/RGU1 overlay the *game* builds; core renders whatever tree it's given |
| `game_sprite.rgr`: `kind == "wedge"` (Pac-Man mouth), `kind == "ghost"` (Pac-Man ghost) | a **registered shape-drawer table**: a game registers `("ghost", fn)`; core dispatches by lookup, ships only primitives (rect/circle/line/poly) |
| `game_audio.rgr`: builtin ids `"brick"`, `"bounce"`, `"wall"` | core owns a synth; **sound *names* are a per-game palette** the game registers; core maps id→spec via that table |
| `engine.d.ts`: `SpriteKind` includes `"wedge"|"ghost"`; `showNet?`; `BuiltinSoundId` = `brick|bounce|wall`; `declare const peerCar {…, steer, finishTick}` | the type surface names **mechanisms** only; game-specific kinds/sounds/globals live in a per-game `<game>.d.ts` (the pattern `breakout.d.ts` already establishes) |

The registration table lives in core; its entries come from the game at load time
(the game calls `registerShape("ghost", fn)` / `registerSound("brick", spec)` during
setup). Adding a shape, sound, or HUD gauge is then a call from the game, with no
edit to `game_sprite.rgr` / `game_audio.rgr` / `game_runtime.rgr`.

---

## 5. One world, one owner

A world must be described in exactly one place. Today autopeli's road+traffic is
encoded **twice** — host `wasm_autopeli_setup.rgr` *and* guest
`rust_autopeli/src/lib.rs` — and they agree only by convention; change one and the
other silently disagrees.

Ideal ownership, in priority order:

1. **The guest owns the world.** It already declares resources
   (`declare_resources()` → `host_sheet`/`host_rect`). Extend the *same* declare-once
   channel so the guest also declares **bodies, bounds, world size, camera hints, and
   static-bg spec**. The default `GameSceneProvider` reads that generically, and the
   host-side `setupPhysics()` copy is **deleted**. The world lives only in the guest.
2. **A too-simple game** may instead ship a tiny `.rgr` provider in its own folder.
   Both routes satisfy the same interface; neither puts the world in core.

The declare-once discipline is inherited from the resource provider and must keep its
limits: declare-once (not runtime-streamable), fixed typed vocabulary, no pointers
cross, one-way guest→host.

---

## 6. Providers, not hand-wiring (the capability seam)

Every host capability a guest uses should plug into a **registry**, not be sewn into
the runner and all three guest bridges by hand (see `PLAN_PROVIDERS.md`). A provider
declares its own direction and cadence so the runner knows which hooks fire:

```
class GameProvider {
    fn id:string ()        ; "resource", "pose", "scene", …
    fn capBit:int ()       ; RG_WASM_HOST_CAP_* it satisfies (0 = base ABI)
    fn direction:int ()    ; 1 = guest->host, 2 = host->guest
    fn cadence:int ()      ; 1 = setup (once), 2 = frame (per physicsStep)
    fn onAttach / onDeclare / beforeUpdate / afterUpdate / onDetach
}
```

And the capability gate must actually run: the handshake
(`rg_required_caps` / `rg_check_env`) is exported by guests today but the host never
calls it. In the ideal, the registry computes the host's advertised caps as the OR of
every provider's `capBit()`, and rejects a guest whose required caps aren't met —
**once, right after load, before `update()`**. Adding a provider automatically widens
what the host advertises; there is no second list to keep in sync.

---

## 7. "Done" is mechanically checkable

The target is met when these three checks pass:

1. **The leak-guard grep returns nothing** for every file that claims to be core:

   ```bash
   grep -rniE 'autopeli|\bpong\b|pacman|invaders|breakout|\bghost\b|\bwedge\b|steer|throttle|\bbrick\b' \
     gallery/game_engine/scripting/wasm_physics_runner.rgr \
     gallery/game_engine/scripting/wasm_game_runner.rgr \
     gallery/game_engine/scripting/game_runtime.rgr \
     gallery/game_engine/scripting/game_sprite.rgr \
     gallery/game_engine/scripting/game_audio.rgr \
     gallery/game_engine/scripting/wasm_abi_io.rgr \
     gallery/game_engine/scripting/engine.d.ts
   ```

   (Wire it into CI, allow-listing today's known offenders and tightening as each
   phase lands — `PLAN_PHYSICS_RUNNER_GENERIC.md` §5.)

2. **A shared header names no game.** `grep -i 'autopeli\|traffic\|cone\|hero\|knight'
   wasm/*.h` is empty; the remaining names live in guest-side headers.

3. **The second-game test passes.** A second, non-autopeli host-physics game (e.g. a
   bumper arena) loads through the *same* `WasmPhysicsRunner` with its own
   provider/guest, and runs. This is the real proof the abstraction holds, and it
   becomes a permanent regression fixture.

When all three hold, the core is genuinely write-once, and a new game is purely
additive: a folder under `games/`, a provider, and a guest — with not one line
changed in `scripting/` core.

---

## 8. Summary — the five concrete changes

| # | Change | Files it touches | Section |
|---|--------|------------------|---------|
| 1 | Move each game-specific constant out of the shared headers into the owning guest's Rust/AS source; leave only byte offsets, record shapes, and the handshake in `wasm/*.h`. | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h` → guest crates | §2.1 |
| 2 | Replace the `steer/throttle/brake/grip` control record with four indexed channels; `wasm_abi_io.rgr` / `as_abi_bridge.rgr` read/write channels by index. | `wasm_game_abi.h`, `wasm_abi_io.rgr`, `as_abi_bridge.rgr` | §2.2 |
| 3 | Give `wasm_physics_runner.rgr` a `provider:GameSceneProvider` field instead of concrete `setup`/`render` autopeli types and imports; move that logic to `games/autopeli_wasm/scene/`. | `wasm_physics_runner.rgr`, `wasm_game_runner.rgr` | §3 |
| 4 | Turn the `if (layout=="pong")`, `kind=="ghost"`, and `"brick"`-sound branches into game-supplied registrations. | `game_runtime.rgr`, `game_sprite.rgr`, `game_audio.rgr`, `engine.d.ts` | §4 |
| 5 | Make the guest the single owner of its world (bodies/bounds/camera declared through the resource channel); delete the host-side `setupPhysics()` copy. | `wasm_autopeli_setup.rgr` (deleted), guest `lib.rs` | §5 |

Enforcement (§7): a CI grep guard fails when a core file names a game, and a second
host-physics game running through the same `WasmPhysicsRunner` is the regression
fixture that proves the seam holds.
